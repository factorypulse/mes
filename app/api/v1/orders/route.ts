import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { OrdersService } from '@/lib/services/orders'
import { z } from 'zod'

// Request validation schemas
const createOrderSchema = z.object({
  orderNumber: z.string().optional(),
  erpReference: z.string().optional(),
  productIdentifier: z.string().min(1, 'Product identifier is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  routingId: z.string().optional(),
  routingName: z.string().optional(),
  priority: z.number().int().min(1).max(5).default(1),
  scheduledStartDate: z.string().datetime().optional(),
  scheduledEndDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
}).refine(
  (data) => data.routingId || data.routingName,
  { message: 'Either routingId or routingName must be provided' }
)

const listOrdersSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  erpReference: z.string().optional(),
  productIdentifier: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['createdAt', 'scheduledStartDate', 'priority']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export async function POST(request: NextRequest) {
  // Validate API authentication
  const authResult = await validateExternalAPIRequest(request)
  if (!authResult.success) {
    return authResult.error
  }

  const { context } = authResult

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Create order using the existing service
    const orderData = {
      orderNumber: validatedData.orderNumber || `ORD-${Date.now()}`,
      routingId: validatedData.routingId!, // TODO: Handle routingName lookup if needed
      quantity: validatedData.quantity,
      priority: validatedData.priority,
      scheduledStartDate: validatedData.scheduledStartDate ? new Date(validatedData.scheduledStartDate) : undefined,
      scheduledEndDate: validatedData.scheduledEndDate ? new Date(validatedData.scheduledEndDate) : undefined,
      notes: validatedData.notes,
      customFields: validatedData.customFields,
      teamId: context.teamId,
    }

    const order = await OrdersService.createOrder(orderData)

    // Format response according to API spec
    const response = NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      erpReference: null, // TODO: Add ERP reference field to order model
      productIdentifier: null, // TODO: Add product identifier field to order model
      quantity: order.quantity,
      routingId: order.routingId,
      priority: order.priority,
      status: order.status.toLowerCase(),
      scheduledStartDate: order.scheduledStartDate?.toISOString(),
      scheduledEndDate: order.scheduledEndDate?.toISOString(),
      notes: order.notes,
      customFields: order.customFields || {},
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      // workOrderOperations: order.workOrderOperations?.map(woo => ({
      //   id: woo.id,
      //   operationNumber: woo.operationNumber,
      //   operationName: woo.operationName,
      //   status: woo.status.toLowerCase(),
      //   departmentId: woo.departmentId,
      // })) || [],
    }, { status: 201 })

    return addRateLimitHeaders(response, 99, Date.now() + 60000) // TODO: Get actual rate limit data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request data',
        400,
        { validationErrors: error.issues }
      )
    }

    console.error('Error creating order via external API:', error)

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message.includes('Routing not found')) {
        return createErrorResponse(
          'ROUTING_NOT_FOUND',
          'The specified routing does not exist or is not accessible',
          404
        )
      }

      if (error.message.includes('duplicate')) {
        return createErrorResponse(
          'DUPLICATE_ORDER',
          'An order with this order number already exists',
          409
        )
      }
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to create order',
      500
    )
  }
}

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
    const validatedParams = listOrdersSchema.parse(queryParams)

    // Build filters for the service
    const filters: any = {
      teamId: context.teamId,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
      sortBy: validatedParams.sort,
      sortOrder: validatedParams.order,
    }

    if (validatedParams.status) {
      filters.status = validatedParams.status.toUpperCase()
    }
    if (validatedParams.fromDate) {
      filters.fromDate = new Date(validatedParams.fromDate)
    }
    if (validatedParams.toDate) {
      filters.toDate = new Date(validatedParams.toDate)
    }
    if (validatedParams.erpReference) {
      filters.erpReference = validatedParams.erpReference
    }
    if (validatedParams.productIdentifier) {
      filters.productIdentifier = validatedParams.productIdentifier
    }

    // Get orders using existing service
    const result = await OrdersService.getOrdersWithFilters(filters)

    // Format response according to API spec
    const response = NextResponse.json({
      orders: result.orders.map(order => {
        const orderWithRelations = order as any
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          erpReference: null, // TODO: Add ERP reference field to order model
          productIdentifier: null, // TODO: Add product identifier field to order model
          quantity: order.quantity,
          status: order.status.toLowerCase(),
          priority: order.priority,
          scheduledStartDate: order.scheduledStartDate?.toISOString(),
          actualStartDate: order.actualStartDate?.toISOString(),
          currentOperation: orderWithRelations.workOrderOperations?.[0] ? {
            id: orderWithRelations.workOrderOperations[0].id,
            operationNumber: orderWithRelations.workOrderOperations[0].operationNumber,
            operationName: orderWithRelations.workOrderOperations[0].operationName,
            status: orderWithRelations.workOrderOperations[0].status.toLowerCase(),
          } : null,
          progress: {
            completedOperations: orderWithRelations.workOrderOperations?.filter((woo: any) => woo.status === 'COMPLETED').length || 0,
            totalOperations: orderWithRelations.workOrderOperations?.length || 0,
            percentComplete: orderWithRelations.workOrderOperations?.length ?
              Math.round((orderWithRelations.workOrderOperations.filter((woo: any) => woo.status === 'COMPLETED').length / orderWithRelations.workOrderOperations.length) * 100) : 0,
          },
          createdAt: order.createdAt.toISOString(),
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

    console.error('Error listing orders via external API:', error)
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to retrieve orders',
      500
    )
  }
}
