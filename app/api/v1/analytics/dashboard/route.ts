import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { AnalyticsService } from '@/lib/services/analytics'
import { z } from 'zod'

// Request validation schemas
const dashboardAnalyticsSchema = z.object({
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  departmentId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  // Validate API authentication
  const authResult = await validateExternalAPIRequest(request)
  if (!authResult.success) {
    return authResult.error
  }

  const { context } = authResult

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validatedParams = dashboardAnalyticsSchema.parse(queryParams)

    // Build filters for the service
    const filters: any = {
      teamId: context.teamId,
    }

    if (validatedParams.fromDate) {
      filters.fromDate = new Date(validatedParams.fromDate)
    }
    if (validatedParams.toDate) {
      filters.toDate = new Date(validatedParams.toDate)
    }
    if (validatedParams.departmentId) {
      filters.departmentId = validatedParams.departmentId
    }

    // Get dashboard analytics using existing service
    // For external API access, use system-level access (all departments)
    const analytics = await AnalyticsService.getDashboardMetrics('system', context.teamId)

    // Format response according to API spec
    const response = NextResponse.json({
      metrics: {
        ordersInProgress: analytics.ordersInProgress || 0,
        operationsInProgress: analytics.operationsInProgress || 0,
        completedOperationsToday: analytics.completedOperationsToday || 0,
        averageCycleTimeSeconds: analytics.averageCycleTime ? Math.round(analytics.averageCycleTime * 3600) : 0,
        onTimeDeliveryRate: analytics.onTimeDeliveryRate || 0,
        operatorUtilization: analytics.operatorUtilization || 0,
      },
      trends: {
        dailyCompletions: [], // TODO: Implement daily completions tracking
      },
      calculatedAt: new Date().toISOString(),
    })

    return addRateLimitHeaders(response, 99, Date.now() + 60000) // TODO: Get actual rate limit data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        400,
        { validationErrors: error.issues }
      )
    }

    console.error('Error getting dashboard analytics via external API:', error)
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to retrieve dashboard analytics',
      500
    )
  }
}
