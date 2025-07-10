import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { WorkOrderOperationsService } from '@/lib/services/work-order-operations'
import { z } from 'zod'

// Request validation schemas
const listWOOSchema = z.object({
  orderId: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'paused', 'completed', 'waiting']).optional(),
  departmentId: z.string().optional(),
  operatorId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
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
    const validatedParams = listWOOSchema.parse(queryParams)

    // Build filters for the service
    const filters: any = {
      teamId: context.teamId,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
    }

    if (validatedParams.orderId) {
      filters.orderId = validatedParams.orderId
    }
    if (validatedParams.status) {
      filters.status = validatedParams.status.toUpperCase()
    }
    if (validatedParams.departmentId) {
      filters.departmentId = validatedParams.departmentId
    }
    if (validatedParams.operatorId) {
      filters.operatorId = validatedParams.operatorId
    }
    if (validatedParams.fromDate) {
      filters.fromDate = new Date(validatedParams.fromDate)
    }
    if (validatedParams.toDate) {
      filters.toDate = new Date(validatedParams.toDate)
    }

    // Get work order operations using existing service
    const result = await WorkOrderOperationsService.getWorkOrderOperationsWithFilters(filters)

    // Format response according to API spec
    const response = NextResponse.json({
      workOrderOperations: result.woos.map(woo => ({
        id: woo.id,
        orderId: woo.orderId,
        orderNumber: woo.order?.orderNumber,
        operationNumber: woo.routingOperation?.operationNumber,
        operationName: woo.routingOperation?.operationName,
        department: woo.routingOperation?.department ? {
          id: woo.routingOperation.department.id,
          name: woo.routingOperation.department.name,
        } : null,
        status: woo.status.toLowerCase(),
        operatorId: woo.operatorId,
        scheduledStartTime: woo.scheduledStartTime?.toISOString(),
        actualStartTime: woo.actualStartTime?.toISOString(),
        targetTimeSeconds: (woo.routingOperation as any)?.targetTimeSeconds || 0,
        elapsedTimeSeconds: 0, // This would need to be calculated
        quantityCompleted: woo.quantityCompleted || 0,
        quantityTarget: woo.order?.quantity || 0,
      })),
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

    console.error('Error listing work order operations via external API:', error)
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to retrieve work order operations',
      500
    )
  }
}
