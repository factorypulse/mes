import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { DataCollectionActivitiesService } from '@/lib/services/data-collection-activities'

export async function GET(request: NextRequest) {
  // Validate API authentication
  const authResult = await validateExternalAPIRequest(request)
  if (!authResult.success) {
    return authResult.error
  }

  const { context } = authResult

  try {
    // Get data collection activities using existing service
    const activities = await DataCollectionActivitiesService.getActivitiesByTeam(context.teamId)

    // Format response according to API spec
    // TODO: Update when actual data collection activities are implemented
    const response = NextResponse.json({
      activities: [], // Placeholder until service is fully implemented
    })

    return addRateLimitHeaders(response, 99, Date.now() + 60000) // TODO: Get actual rate limit data
  } catch (error) {
    console.error('Error getting data collection activities via external API:', error)
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to retrieve data collection activities',
      500
    )
  }
}
