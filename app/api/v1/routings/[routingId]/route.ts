import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { RoutingsService } from '@/lib/services/routings'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ routingId: string }> }
) {
  // Validate API authentication
  const authResult = await validateExternalAPIRequest(request)
  if (!authResult.success) {
    return authResult.error
  }

  const { context: authContext } = authResult
  const { routingId } = await context.params

  try {
    // Get routing details using existing service
    const routing = await RoutingsService.getRoutingById(routingId, authContext.teamId)

    if (!routing) {
      return createErrorResponse(
        'ROUTING_NOT_FOUND',
        'Routing not found or access denied',
        404
      )
    }

    // Format response according to API spec
    const routingWithRelations = routing as any
    const response = NextResponse.json({
      id: routing.id,
      name: routing.name,
      description: routing.description,
      version: routing.version || '1.0',
      isActive: routing.isActive,
      operations: routingWithRelations.operations?.map((operation: any) => ({
        id: operation.id,
        operationNumber: operation.sequence,
        operationName: operation.title,
        department: operation.department ? {
          id: operation.department.id,
          name: operation.department.name,
        } : null,
        setupTimeMinutes: Math.floor((operation.setupTimeSeconds || 0) / 60),
        runTimeMinutes: Math.floor((operation.targetTimeSeconds || 0) / 60),
        instructions: operation.instructions || '',
        requiredSkills: [], // TODO: Add skills field to operations if needed
        dataCollectionActivities: operation.dataCollectionActivities?.map((dca: any) => ({
          id: dca.id,
          name: dca.name,
          isRequired: dca.isRequired || false,
          sequence: dca.sequence || 1,
        })) || [],
      })) || [],
      createdAt: routing.createdAt.toISOString(),
      updatedAt: routing.updatedAt.toISOString(),
    })

    return addRateLimitHeaders(response, 99, Date.now() + 60000) // TODO: Get actual rate limit data
  } catch (error) {
    console.error('Error getting routing details via external API:', error)
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to retrieve routing details',
      500
    )
  }
}
