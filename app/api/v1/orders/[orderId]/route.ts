import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { OrdersService } from '@/lib/services/orders'
import { z } from 'zod'

// Request validation schemas
const updateOrderSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'on_hold', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  // Validate API authentication
  const authResult = await validateExternalAPIRequest(request)
  if (!authResult.success) {
    return authResult.error
  }

  const { context: authContext } = authResult
  const { orderId } = await context.params

  try {
    // Get order details using existing service
    const order = await OrdersService.getOrderById(orderId, authContext.teamId)

    if (!order) {
      return createErrorResponse(
        'ORDER_NOT_FOUND',
        'Order not found or access denied',
        404
      )
    }

    // Format response according to API spec
    const response = NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      erpReference: null, // TODO: Add ERP reference field to order model
      productIdentifier: null, // TODO: Add product identifier field to order model
      quantity: order.quantity,
      status: order.status.toLowerCase(),
      priority: order.priority,
      scheduledStartDate: order.scheduledStartDate?.toISOString(),
      actualStartDate: order.actualStartDate?.toISOString(),
      routing: {
        id: order.routingId,
        name: null, // TODO: Include routing details in order query
        version: '1.0',
      },
      // workOrderOperations: order.workOrderOperations?.map(woo => ({
      //   id: woo.id,
      //   operationNumber: woo.operationNumber,
      //   operationName: woo.operationName,
      //   department: woo.department ? {
      //     id: woo.department.id,
      //     name: woo.department.name,
      //   } : null,
      //   status: woo.status.toLowerCase(),
      //   actualStartTime: woo.actualStartTime?.toISOString(),
      //   actualEndTime: woo.actualEndTime?.toISOString(),
      //   operatorId: woo.operatorId,
      //   quantityCompleted: woo.quantityCompleted,
      //   capturedData: woo.capturedData || {},
      // })) || [],
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })

    return addRateLimitHeaders(response, 99, Date.now() + 60000) // TODO: Get actual rate limit data
  } catch (error) {
    console.error('Error getting order details via external API:', error)
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to retrieve order details',
      500
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  // Validate API authentication
  const authResult = await validateExternalAPIRequest(request)
  if (!authResult.success) {
    return authResult.error
  }

  const { context: authContext } = authResult
  const { orderId } = await context.params

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateOrderSchema.parse(body)

    // Get current order to verify it exists and user has access
    const currentOrder = await OrdersService.getOrderById(orderId, authContext.teamId)
    if (!currentOrder) {
      return createErrorResponse(
        'ORDER_NOT_FOUND',
        'Order not found or access denied',
        404
      )
    }

    // Build update data
    const updateData: any = {}
    if (validatedData.status) {
      updateData.status = validatedData.status.toUpperCase()
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }
    if (validatedData.priority !== undefined) {
      updateData.priority = validatedData.priority
    }

    // Update order using existing service
    const updatedOrder = await OrdersService.updateOrder(orderId, authContext.teamId, updateData)

    if (!updatedOrder) {
      return createErrorResponse(
        'ORDER_NOT_FOUND',
        'Order not found or access denied',
        404
      )
    }

    // Format response according to API spec
    const response = NextResponse.json({
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      erpReference: null, // TODO: Add ERP reference field to order model
      productIdentifier: null, // TODO: Add product identifier field to order model
      quantity: updatedOrder.quantity,
      status: updatedOrder.status.toLowerCase(),
      priority: updatedOrder.priority,
      scheduledStartDate: updatedOrder.scheduledStartDate?.toISOString(),
      actualStartDate: updatedOrder.actualStartDate?.toISOString(),
      notes: updatedOrder.notes,
      customFields: updatedOrder.customFields || {},
      // workOrderOperations: [], // TODO: Include work order operations in response
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString(),
    })

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

    console.error('Error updating order via external API:', error)

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message.includes('Invalid status transition')) {
        return createErrorResponse(
          'INVALID_STATUS_TRANSITION',
          'The requested status change is not valid for this order',
          400
        )
      }

      if (error.message.includes('Order is locked')) {
        return createErrorResponse(
          'ORDER_LOCKED',
          'Order cannot be modified in its current state',
          409
        )
      }
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to update order',
      500
    )
  }
}
