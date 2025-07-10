import { prisma } from '@/lib/prisma'
import { randomBytes, createHash } from 'crypto'

export interface APIKeyPermissions {
  read: boolean
  write: boolean
  admin: boolean
}

export interface CreateAPIKeyRequest {
  teamId: string
  name: string
  description?: string
  permissions: APIKeyPermissions
  expiresAt?: Date
  createdBy: string
}

export interface APIKey {
  id: string
  teamId: string
  name: string
  description?: string
  keyPrefix: string
  permissions: APIKeyPermissions
  isActive: boolean
  expiresAt?: Date
  lastUsedAt?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface APIKeyWithSecret extends APIKey {
  secretKey: string // Only returned on creation
}

export interface ValidatedAPIKey extends APIKey {
  isValid: boolean
  reason?: string
}

export class APIKeysService {
  /**
   * Generate a secure API key with proper prefix and entropy
   */
  private static generateAPIKey(): { secretKey: string; keyPrefix: string; keyHash: string } {
    // Generate 32 bytes of random data for the key
    const keyBytes = randomBytes(32)
    const keyBase64 = keyBytes.toString('base64url')

    // Create the full API key with prefix
    const secretKey = `mes_${keyBase64}`

    // Extract prefix (first 8 characters after mes_)
    const keyPrefix = `mes_${keyBase64.substring(0, 8)}`

    // Hash the full key for storage
    const keyHash = createHash('sha256').update(secretKey).digest('hex')

    return { secretKey, keyPrefix, keyHash }
  }

  /**
   * Create a new API key for a team
   */
  static async createAPIKey(request: CreateAPIKeyRequest): Promise<APIKeyWithSecret> {
    const { secretKey, keyPrefix, keyHash } = this.generateAPIKey()

    const apiKey = await prisma.mESAPIKey.create({
      data: {
        teamId: request.teamId,
        name: request.name,
        description: request.description,
        keyHash,
        keyPrefix,
        permissions: request.permissions as any,
        expiresAt: request.expiresAt,
        createdBy: request.createdBy,
      },
    })

    return {
      ...apiKey,
      description: apiKey.description || undefined,
      expiresAt: apiKey.expiresAt || undefined,
      lastUsedAt: apiKey.lastUsedAt || undefined,
      permissions: apiKey.permissions as unknown as APIKeyPermissions,
      secretKey, // Only returned on creation
    }
  }

  /**
   * Validate an API key and return key information if valid
   */
  static async validateAPIKey(apiKey: string): Promise<ValidatedAPIKey | null> {
    try {
      // Check if the key format is correct
      if (!apiKey.startsWith('mes_')) {
        return null
      }

      // Hash the provided key
      const keyHash = createHash('sha256').update(apiKey).digest('hex')

      // Look up the key in the database
      const dbKey = await prisma.mESAPIKey.findUnique({
        where: { keyHash },
        cacheStrategy: { swr: 300, ttl: 300 } // 5-minute cache for API key lookups (authentication)
      })

      if (!dbKey) {
        return null
      }

      // Check if key is active
      if (!dbKey.isActive) {
        return {
          ...dbKey,
          description: dbKey.description || undefined,
          expiresAt: dbKey.expiresAt || undefined,
          lastUsedAt: dbKey.lastUsedAt || undefined,
          permissions: dbKey.permissions as unknown as APIKeyPermissions,
          isValid: false,
          reason: 'API key is disabled',
        }
      }

      // Check if key has expired
      if (dbKey.expiresAt && dbKey.expiresAt < new Date()) {
        return {
          ...dbKey,
          description: dbKey.description || undefined,
          expiresAt: dbKey.expiresAt || undefined,
          lastUsedAt: dbKey.lastUsedAt || undefined,
          permissions: dbKey.permissions as unknown as APIKeyPermissions,
          isValid: false,
          reason: 'API key has expired',
        }
      }

      // Update last used timestamp
      await prisma.mESAPIKey.update({
        where: { id: dbKey.id },
        data: { lastUsedAt: new Date() },
      })

      return {
        ...dbKey,
        description: dbKey.description || undefined,
        expiresAt: dbKey.expiresAt || undefined,
        lastUsedAt: dbKey.lastUsedAt || undefined,
        permissions: dbKey.permissions as unknown as APIKeyPermissions,
        isValid: true,
      }
    } catch (error) {
      console.error('Error validating API key:', error)
      return null
    }
  }

  /**
   * Get all API keys for a team
   */
  static async getAPIKeysByTeam(teamId: string): Promise<APIKey[]> {
    const apiKeys = await prisma.mESAPIKey.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      cacheStrategy: { swr: 180, ttl: 180 } // 3-minute cache for API key listings
    })

    return apiKeys.map(key => ({
      ...key,
      description: key.description || undefined,
      expiresAt: key.expiresAt || undefined,
      lastUsedAt: key.lastUsedAt || undefined,
      permissions: key.permissions as unknown as APIKeyPermissions,
    }))
  }

  /**
   * Get a specific API key by ID (without the secret)
   */
  static async getAPIKeyById(id: string, teamId: string): Promise<APIKey | null> {
    const apiKey = await prisma.mESAPIKey.findFirst({
      where: { id, teamId },
      cacheStrategy: { swr: 180, ttl: 180 } // 3-minute cache for individual API key lookups
    })

    if (!apiKey) {
      return null
    }

    return {
      ...apiKey,
      description: apiKey.description || undefined,
      expiresAt: apiKey.expiresAt || undefined,
      lastUsedAt: apiKey.lastUsedAt || undefined,
      permissions: apiKey.permissions as unknown as APIKeyPermissions,
    }
  }

  /**
   * Update API key properties (not the key itself)
   */
  static async updateAPIKey(
    id: string,
    teamId: string,
    updates: {
      name?: string
      description?: string
      permissions?: APIKeyPermissions
      isActive?: boolean
      expiresAt?: Date
    }
  ): Promise<APIKey | null> {
    try {
      const apiKey = await prisma.mESAPIKey.update({
        where: { id, teamId },
        data: {
          ...updates,
          permissions: updates.permissions as any
        },
      })

      return {
        ...apiKey,
        description: apiKey.description || undefined,
        expiresAt: apiKey.expiresAt || undefined,
        lastUsedAt: apiKey.lastUsedAt || undefined,
        permissions: apiKey.permissions as unknown as APIKeyPermissions,
      }
    } catch (error) {
      console.error('Error updating API key:', error)
      return null
    }
  }

  /**
   * Delete/revoke an API key
   */
  static async revokeAPIKey(id: string, teamId: string): Promise<boolean> {
    try {
      await prisma.mESAPIKey.delete({
        where: { id, teamId },
      })
      return true
    } catch (error) {
      console.error('Error revoking API key:', error)
      return false
    }
  }

  /**
   * Check if an API key has a specific permission
   */
  static hasPermission(apiKey: ValidatedAPIKey, permission: keyof APIKeyPermissions): boolean {
    if (!apiKey.isValid) {
      return false
    }
    return apiKey.permissions[permission] === true
  }

  /**
   * Log API key usage for rate limiting and audit purposes
   */
  static async logAPIKeyUsage(
    apiKeyId: string,
    teamId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.mESAPIKeyUsage.create({
        data: {
          apiKeyId,
          teamId,
          endpoint,
          method,
          statusCode,
          responseTime,
          ipAddress,
          userAgent,
        },
      })
    } catch (error) {
      console.error('Error logging API key usage:', error)
    }
  }

  /**
   * Check rate limit for an API key
   * Returns { allowed: boolean, remaining: number, resetTime: Date }
   */
  static async checkRateLimit(
    apiKeyId: string,
    hourlyLimit: number = 1000,
    minuteLimit: number = 100
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date; window: 'hour' | 'minute' }> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

    // Check hourly limit
    const hourlyUsage = await prisma.mESAPIKeyUsage.count({
      where: {
        apiKeyId,
        timestamp: { gte: oneHourAgo },
      },
    })

    if (hourlyUsage >= hourlyLimit) {
      const nextHour = new Date(Math.ceil(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000))
      return {
        allowed: false,
        remaining: 0,
        resetTime: nextHour,
        window: 'hour',
      }
    }

    // Check minute limit (burst)
    const minuteUsage = await prisma.mESAPIKeyUsage.count({
      where: {
        apiKeyId,
        timestamp: { gte: oneMinuteAgo },
      },
    })

    if (minuteUsage >= minuteLimit) {
      const nextMinute = new Date(Math.ceil(now.getTime() / (60 * 1000)) * (60 * 1000))
      return {
        allowed: false,
        remaining: 0,
        resetTime: nextMinute,
        window: 'minute',
      }
    }

    // Return the more restrictive limit
    const hourlyRemaining = hourlyLimit - hourlyUsage
    const minuteRemaining = minuteLimit - minuteUsage

    if (minuteRemaining < hourlyRemaining) {
      const nextMinute = new Date(Math.ceil(now.getTime() / (60 * 1000)) * (60 * 1000))
      return {
        allowed: true,
        remaining: minuteRemaining,
        resetTime: nextMinute,
        window: 'minute',
      }
    } else {
      const nextHour = new Date(Math.ceil(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000))
      return {
        allowed: true,
        remaining: hourlyRemaining,
        resetTime: nextHour,
        window: 'hour',
      }
    }
  }

  /**
   * Get API key usage statistics
   */
  static async getUsageStats(
    apiKeyId: string,
    teamId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{
    totalRequests: number
    successfulRequests: number
    errorRequests: number
    averageResponseTime: number
    requestsByEndpoint: { endpoint: string; count: number }[]
  }> {
    const usage = await prisma.mESAPIKeyUsage.findMany({
      where: {
        apiKeyId,
        teamId,
        timestamp: {
          gte: fromDate,
          lte: toDate,
        },
      },
      cacheStrategy: { swr: 300, ttl: 300 } // 5-minute cache for usage statistics
    })

    const totalRequests = usage.length
    const successfulRequests = usage.filter(u => u.statusCode >= 200 && u.statusCode < 400).length
    const errorRequests = totalRequests - successfulRequests
    const averageResponseTime = usage.length > 0
      ? Math.round(usage.reduce((sum, u) => sum + u.responseTime, 0) / usage.length)
      : 0

    // Group by endpoint
    const endpointMap = new Map<string, number>()
    usage.forEach(u => {
      const count = endpointMap.get(u.endpoint) || 0
      endpointMap.set(u.endpoint, count + 1)
    })

    const requestsByEndpoint = Array.from(endpointMap.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      averageResponseTime,
      requestsByEndpoint,
    }
  }
}
