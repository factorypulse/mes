import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { WorkOrderOperationsService } from '@/lib/services/work-order-operations'
import { z } from 'zod'

// Request validation schemas
const updateWOOSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'complete']),
  operatorId: z.string().optional(),
  pauseReasonId: z.string().optional(),
  capturedData: z.record(z.string(), z.any()).optional(),
  quantityCompleted: z.number().int().min(0).optional(),
  quantityRejected: z.number().int().min(0).optional(),
}).superRefine((data, ctx) => {
  // Validate required fields based on action
  if (data.action === 'start' && !data.operatorId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'operatorId is required for start action',
      path: ['operatorId'],
    })
  }

  if (data.action === 'pause' && !data.pauseReasonId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'pauseReasonId is required for pause action',
      path: ['pauseReasonId'],
    })
  }
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ wooId: string }> }
) {
  // Validate API authentication
  const authResult = await validateExternalAPIRequest(request)
  if (!authResult.success) {
    return authResult.error
  }

  const { context: authContext } = authResult
  const { wooId } = await context.params

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateWOOSchema.parse(body)

    // Get current WOO to verify it exists and user has access
    const currentWOO = await WorkOrderOperationsService.getWOOById(wooId, authContext.teamId)
    if (!currentWOO) {
      return createErrorResponse(
        'WOO_NOT_FOUND',
        'Work order operation not found or access denied',
        404
      )
    }

    let updatedWOO

    // Perform the requested action
    switch (validatedData.action) {
      case 'start':
        updatedWOO = await WorkOrderOperationsService.startWOO(
          wooId,
          authContext.teamId,
          validatedData.operatorId!
        )
        break

      case 'pause':
        updatedWOO = await WorkOrderOperationsService.pauseWOO(
          wooId,
          authContext.teamId,
          validatedData.pauseReasonId!,
          validatedData.capturedData?.notes || ''
        )
        break

      case 'resume':
        updatedWOO = await WorkOrderOperationsService.resumeWOO(
          wooId,
          authContext.teamId
        )
        break

      case 'complete':
        const completionData = {
          quantityCompleted: validatedData.quantityCompleted,
          quantityRejected: validatedData.quantityRejected || 0,
          capturedData: validatedData.capturedData || {},
        }
        updatedWOO = await WorkOrderOperationsService.completeWOO(
          wooId,
          authContext.teamId,
          completionData.capturedData,
          completionData.quantityCompleted,
          completionData.quantityRejected
        )
        break

      default:
        return createErrorResponse(
          'INVALID_ACTION',
          'Invalid action specified',
          400
        )
    }

    if (!updatedWOO) {
      return createErrorResponse(
        'OPERATION_FAILED',
        'Failed to update work order operation',
        500
      )
    }

    // Format response according to API spec
    const response = NextResponse.json({
      id: updatedWOO.id,
      status: updatedWOO.status.toLowerCase(),
      actualStartTime: updatedWOO.actualStartTime?.toISOString(),
      actualEndTime: updatedWOO.actualEndTime?.toISOString(),
      totalActiveTimeSeconds: await WorkOrderOperationsService.calculateActiveTime(updatedWOO.id),
      operatorId: updatedWOO.operatorId,
      quantityCompleted: updatedWOO.quantityCompleted || 0,
      capturedData: updatedWOO.capturedData || {},
      updatedAt: updatedWOO.updatedAt.toISOString(),
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

    console.error('Error updating work order operation via external API:', error)

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message.includes('Invalid state transition')) {
        return createErrorResponse(
          'INVALID_STATE_TRANSITION',
          'The requested action is not valid for the current WOO state',
          400
        )
      }

      if (error.message.includes('Operator not available')) {
        return createErrorResponse(
          'OPERATOR_NOT_AVAILABLE',
          'The specified operator is not available or does not exist',
          400
        )
      }

      if (error.message.includes('Pause reason not found')) {
        return createErrorResponse(
          'PAUSE_REASON_NOT_FOUND',
          'The specified pause reason does not exist',
          400
        )
      }

      if (error.message.includes('WOO is locked')) {
        return createErrorResponse(
          'WOO_LOCKED',
          'Work order operation is locked and cannot be modified',
          409
        )
      }
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to update work order operation',
      500
    )
  }
}
