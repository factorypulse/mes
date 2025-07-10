import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { RoutingsService } from '@/lib/services/routings'
import { z } from 'zod'

// Request validation schemas
const listRoutingsSchema = z.object({
  activeOnly: z.coerce.boolean().default(true),
  productIdentifier: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
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
    const validatedParams = listRoutingsSchema.parse(queryParams)

    // Build filters for the service
    const filters: any = {
      teamId: context.teamId,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
      isActive: validatedParams.activeOnly,
    }

    if (validatedParams.productIdentifier) {
      filters.productIdentifier = validatedParams.productIdentifier
    }

    // Get routings using existing service
    const result = await RoutingsService.getRoutingsWithFilters(filters)

    // Format response according to API spec
    const response = NextResponse.json({
      routings: result.routings.map(routing => {
        const routingWithRelations = routing as any
        return {
          id: routing.id,
          name: routing.name,
          description: routing.description,
          version: routing.version || '1.0',
          isActive: routing.isActive,
          operationsCount: routingWithRelations.operations?.length || 0,
          estimatedCycleTimeSeconds: routingWithRelations.operations?.reduce((total: number, op: any) => total + (op.targetTimeSeconds || 0), 0) || 0,
          createdAt: routing.createdAt.toISOString(),
        }
      }),
      pagination: {
        total: result.total,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        hasMore: result.total > validatedParams.offset + validatedParams.limit,
      },
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

    console.error('Error listing routings via external API:', error)
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to retrieve routings',
      500
    )
  }
}
