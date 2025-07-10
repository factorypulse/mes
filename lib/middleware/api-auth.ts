import { NextRequest, NextResponse } from 'next/server'
import { APIKeysService, ValidatedAPIKey, APIKeyPermissions } from '@/lib/services/api-keys'
import { prisma } from '@/lib/prisma'

export interface APIContext {
  apiKey: ValidatedAPIKey
  teamId: string
  permissions: APIKeyPermissions
  requestStart: number
}

export interface APIAuthResult {
  success: boolean
  context?: APIContext
  response?: NextResponse
}

export class APIAuthMiddleware {
  /**
   * Extract API key from Authorization header
   */
  private static extractAPIKey(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  }

  /**
   * Extract team ID from X-MES-Team-ID header
   */
  private static extractTeamId(request: NextRequest): string | null {
    return request.headers.get('x-mes-team-id')
  }

  /**
   * Get client IP address from request
   */
  private static getClientIP(request: NextRequest): string {
    // Check for forwarded IP first (for reverse proxies)
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    // Fallback to connection remote address (may not be available in all environments)
    return 'unknown'
  }

  /**
   * Create error response with proper format
   */
  private static createErrorResponse(
    status: number,
    code: string,
    message: string,
    details?: any
  ): NextResponse {
    const errorResponse = {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    }

    return NextResponse.json(errorResponse, { status })
  }

  /**
   * Add rate limit headers to response
   */
  private static addRateLimitHeaders(
    response: NextResponse,
    rateLimit: {
      allowed: boolean
      remaining: number
      resetTime: Date
      window: 'hour' | 'minute'
    }
  ): void {
    const limit = rateLimit.window === 'hour' ? 1000 : 100
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.floor(rateLimit.resetTime.getTime() / 1000).toString())
    response.headers.set('X-RateLimit-Window', rateLimit.window)
  }

  /**
   * Log API request for audit purposes
   */
  private static async logAuditEvent(
    apiKeyId: string,
    teamId: string,
    action: string,
    resource: string,
    request: NextRequest,
    statusCode: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const url = new URL(request.url)
      const endpoint = url.pathname
      const method = request.method

      await prisma.mESAuditLog.create({
        data: {
          teamId,
          apiKeyId,
          action,
          resource,
          endpoint,
          method,
          ipAddress: this.getClientIP(request),
          userAgent: request.headers.get('user-agent'),
          statusCode,
          errorMessage,
        },
      })
    } catch (error) {
      console.error('Error logging audit event:', error)
    }
  }

  /**
   * Main authentication method
   */
  static async authenticate(
    request: NextRequest,
    requiredPermission: keyof APIKeyPermissions = 'read'
  ): Promise<APIAuthResult> {
    const requestStart = Date.now()

    try {
      // Extract API key from Authorization header
      const apiKeySecret = this.extractAPIKey(request)
      if (!apiKeySecret) {
        return {
          success: false,
          response: this.createErrorResponse(
            401,
            'MISSING_API_KEY',
            'API key is required. Include it in the Authorization header as "Bearer <api_key>"'
          ),
        }
      }

      // Extract team ID from header
      const teamId = this.extractTeamId(request)
      if (!teamId) {
        return {
          success: false,
          response: this.createErrorResponse(
            400,
            'MISSING_TEAM_ID',
            'Team ID is required. Include it in the X-MES-Team-ID header'
          ),
        }
      }

      // Validate API key
      const apiKey = await APIKeysService.validateAPIKey(apiKeySecret)
      if (!apiKey || !apiKey.isValid) {
        await this.logAuditEvent(
          apiKey?.id || 'unknown',
          teamId,
          'AUTHENTICATE',
          'api_key',
          request,
          401,
          apiKey?.reason || 'Invalid API key'
        )

        return {
          success: false,
          response: this.createErrorResponse(
            401,
            'INVALID_API_KEY',
            apiKey?.reason || 'Invalid or expired API key'
          ),
        }
      }

      // Verify team ID matches API key
      if (apiKey.teamId !== teamId) {
        await this.logAuditEvent(
          apiKey.id,
          teamId,
          'AUTHENTICATE',
          'api_key',
          request,
          403,
          'Team ID mismatch'
        )

        return {
          success: false,
          response: this.createErrorResponse(
            403,
            'TEAM_MISMATCH',
            'API key does not have access to the specified team'
          ),
        }
      }

      // Check required permission
      if (!APIKeysService.hasPermission(apiKey, requiredPermission)) {
        await this.logAuditEvent(
          apiKey.id,
          teamId,
          'AUTHENTICATE',
          'api_key',
          request,
          403,
          `Insufficient permissions: ${requiredPermission} required`
        )

        return {
          success: false,
          response: this.createErrorResponse(
            403,
            'INSUFFICIENT_PERMISSIONS',
            `This API key does not have ${requiredPermission} permissions`
          ),
        }
      }

      // Check rate limits
      const rateLimit = await APIKeysService.checkRateLimit(apiKey.id)
      if (!rateLimit.allowed) {
        await this.logAuditEvent(
          apiKey.id,
          teamId,
          'AUTHENTICATE',
          'api_key',
          request,
          429,
          `Rate limit exceeded: ${rateLimit.window}`
        )

        const response = this.createErrorResponse(
          429,
          'RATE_LIMIT_EXCEEDED',
          `Rate limit exceeded. Try again after ${rateLimit.resetTime.toISOString()}`
        )
        this.addRateLimitHeaders(response, rateLimit)

        return {
          success: false,
          response,
        }
      }

      // Success - return API context
      return {
        success: true,
        context: {
          apiKey,
          teamId,
          permissions: apiKey.permissions,
          requestStart,
        },
      }
    } catch (error) {
      console.error('Error in API authentication:', error)
      return {
        success: false,
        response: this.createErrorResponse(
          500,
          'AUTHENTICATION_ERROR',
          'Internal error during authentication'
        ),
      }
    }
  }

  /**
   * Middleware wrapper for API routes
   */
  static withAuth(
    handler: (request: NextRequest, context: APIContext, params?: any) => Promise<NextResponse>,
    requiredPermission: keyof APIKeyPermissions = 'read'
  ) {
    return async (request: NextRequest, params?: any): Promise<NextResponse> => {
      const authResult = await this.authenticate(request, requiredPermission)

      if (!authResult.success) {
        return authResult.response!
      }

      const context = authResult.context!
      let response: NextResponse
      let statusCode = 200

      try {
        // Call the actual handler
        response = await handler(request, context, params)
        statusCode = response.status

        // Add rate limit headers to successful responses
        const rateLimit = await APIKeysService.checkRateLimit(context.apiKey.id)
        this.addRateLimitHeaders(response, rateLimit)

        return response
      } catch (error) {
        console.error('Error in API handler:', error)
        statusCode = 500
        response = this.createErrorResponse(
          500,
          'INTERNAL_ERROR',
          'Internal server error'
        )
        return response
      } finally {
        // Log API usage and audit trail
        const responseTime = Date.now() - context.requestStart
        const url = new URL(request.url)
        const endpoint = url.pathname
        const method = request.method

        // Log usage for rate limiting
        await APIKeysService.logAPIKeyUsage(
          context.apiKey.id,
          context.teamId,
          endpoint,
          method,
          statusCode,
          responseTime,
          this.getClientIP(request),
          request.headers.get('user-agent') || undefined
        )

        // Log audit event
        await this.logAuditEvent(
          context.apiKey.id,
          context.teamId,
          method,
          endpoint.split('/').pop() || 'unknown',
          request,
          statusCode,
          statusCode >= 400 ? 'API request failed' : undefined
        )
      }
    }
  }

  /**
   * Health check endpoint that doesn't require authentication
   */
  static async healthCheck(request: NextRequest): Promise<NextResponse> {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0',
    })
  }
}

// Utility function for external API routes
export function createAPIRoute(
  handler: (request: NextRequest, context: APIContext, params?: any) => Promise<NextResponse>,
  requiredPermission: keyof APIKeyPermissions = 'read'
) {
  return APIAuthMiddleware.withAuth(handler, requiredPermission)
}
