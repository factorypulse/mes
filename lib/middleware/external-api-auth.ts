import { NextRequest, NextResponse } from 'next/server'
import { APIKeysService } from '@/lib/services/api-keys'
import { prisma } from '@/lib/prisma'

interface RateLimitData {
  count: number
  resetTime: number
  windowStart: number
}

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitData>()

// Rate limiting configuration
const RATE_LIMITS = {
  REQUESTS_PER_HOUR: 1000,
  BURST_REQUESTS_PER_MINUTE: 100,
  WINDOW_SIZE_MS: 60 * 1000, // 1 minute for burst
  HOUR_WINDOW_MS: 60 * 60 * 1000, // 1 hour
}

export interface ExternalAPIContext {
  apiKey: {
    id: string
    teamId: string
    permissions: {
      read: boolean
      write: boolean
      admin: boolean
    }
  }
  teamId: string
}

export async function validateExternalAPIRequest(
  request: NextRequest
): Promise<{ success: true; context: ExternalAPIContext } | { success: false; error: NextResponse }> {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: {
              code: 'MISSING_API_KEY',
              message: 'API key required. Include Authorization: Bearer <API_KEY> header.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 401 }
        ),
      }
    }

    const apiKey = authHeader.substring(7) // Remove "Bearer " prefix

    // Extract team ID from X-MES-Team-ID header
    const teamIdHeader = request.headers.get('X-MES-Team-ID')
    if (!teamIdHeader) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: {
              code: 'MISSING_TEAM_ID',
              message: 'Team ID required. Include X-MES-Team-ID header.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    // Validate API key
    const apiKeyData = await APIKeysService.validateAPIKey(apiKey)
    if (!apiKeyData) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: {
              code: 'INVALID_API_KEY',
              message: 'Invalid or expired API key.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 401 }
        ),
      }
    }

    // Verify API key belongs to the specified team
    if (apiKeyData.teamId !== teamIdHeader) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: {
              code: 'TEAM_ACCESS_DENIED',
              message: 'API key does not have access to the specified team.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        ),
      }
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(apiKeyData.id)
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Rate limit exceeded.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 429 }
      )

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', RATE_LIMITS.REQUESTS_PER_HOUR.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())

      return {
        success: false,
        error: response,
      }
    }

    // Check method permissions
    const method = request.method
    const requiresWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const requiresAdmin = method === 'DELETE'

    if (requiresAdmin && !apiKeyData.permissions.admin) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'Admin permissions required for this operation.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        ),
      }
    }

    if (requiresWrite && !apiKeyData.permissions.write && !apiKeyData.permissions.admin) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'Write permissions required for this operation.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        ),
      }
    }

    if (!apiKeyData.permissions.read && !apiKeyData.permissions.write && !apiKeyData.permissions.admin) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'Read permissions required for this operation.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        ),
      }
    }

    return {
      success: true,
      context: {
        apiKey: apiKeyData,
        teamId: teamIdHeader,
      },
    }
  } catch (error) {
    console.error('External API validation error:', error)
    return {
      success: false,
      error: NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error during API validation.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      ),
    }
  }
}

async function checkRateLimit(apiKeyId: string): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
}> {
  const now = Date.now()
  const windowStart = Math.floor(now / RATE_LIMITS.WINDOW_SIZE_MS) * RATE_LIMITS.WINDOW_SIZE_MS
  const resetTime = windowStart + RATE_LIMITS.WINDOW_SIZE_MS

  let data = rateLimitStore.get(apiKeyId)

  // Initialize or reset if window has passed
  if (!data || data.windowStart !== windowStart) {
    data = {
      count: 0,
      resetTime,
      windowStart,
    }
  }

  // Check burst limit (per minute)
  if (data.count >= RATE_LIMITS.BURST_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: data.resetTime,
    }
  }

  // TODO: Implement hourly rate limiting check
  // For now, just check burst limit

  // Increment counter
  data.count++
  rateLimitStore.set(apiKeyId, data)

  return {
    allowed: true,
    remaining: RATE_LIMITS.BURST_REQUESTS_PER_MINUTE - data.count,
    resetTime: data.resetTime,
  }
}

export function addRateLimitHeaders(response: NextResponse, remaining: number, resetTime: number): NextResponse {
  response.headers.set('X-RateLimit-Limit', RATE_LIMITS.REQUESTS_PER_HOUR.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
  return response
}

export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      },
    },
    { status }
  )
}
