import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { DataCollectionActivitiesService } from '@/lib/services/data-collection-activities'
import { z } from 'zod'

// Request validation schemas
const submitDataCollectionSchema = z.object({
  workOrderOperationId: z.string().min(1, 'Work order operation ID is required'),
  dataCollectionActivityId: z.string().min(1, 'Data collection activity ID is required'),
  operatorId: z.string().min(1, 'Operator ID is required'),
  collectedData: z.record(z.string(), z.any()).refine(data => Object.keys(data).length > 0, 'Collected data is required'),
  timestamp: z.string().datetime().optional(),
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
    const validatedData = submitDataCollectionSchema.parse(body)

    // Submit data collection using existing service
    const dataCollectionData = {
      workOrderOperationId: validatedData.workOrderOperationId,
      dataCollectionActivityId: validatedData.dataCollectionActivityId,
      operatorId: validatedData.operatorId,
      collectedData: validatedData.collectedData,
      collectedAt: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
    }

    // TODO: Implement data submission once service methods are available
    // For now, return a placeholder response structure
    const response = NextResponse.json({
      id: `data-${Date.now()}`,
      workOrderOperationId: dataCollectionData.workOrderOperationId,
      dataCollectionActivityId: dataCollectionData.dataCollectionActivityId,
      operatorId: dataCollectionData.operatorId,
      collectedData: dataCollectionData.collectedData,
      collectedAt: dataCollectionData.collectedAt.toISOString(),
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

    console.error('Error submitting data collection via external API:', error)

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message.includes('Work order operation not found')) {
        return createErrorResponse(
          'WOO_NOT_FOUND',
          'The specified work order operation does not exist or is not accessible',
          404
        )
      }

      if (error.message.includes('Data collection activity not found')) {
        return createErrorResponse(
          'ACTIVITY_NOT_FOUND',
          'The specified data collection activity does not exist',
          404
        )
      }

      if (error.message.includes('Invalid data format')) {
        return createErrorResponse(
          'INVALID_DATA_FORMAT',
          'The submitted data does not match the required format for this activity',
          400
        )
      }
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to submit data collection',
      500
    )
  }
}
