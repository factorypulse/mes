import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, addRateLimitHeaders, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { z } from 'zod'

// Configuration
const UPLOAD_DIR = './uploads'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// Request validation schemas
const attachmentTypeSchema = z.enum(['instruction', 'drawing', 'photo', 'document'])

export async function POST(request: NextRequest) {
  // Validate API authentication
  const authResult = await validateExternalAPIRequest(request)
  if (!authResult.success) {
    return authResult.error
  }

  const { context } = authResult

  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const workOrderOperationId = formData.get('workOrderOperationId') as string
    const routingOperationId = formData.get('routingOperationId') as string
    const attachmentType = formData.get('attachmentType') as string
    const description = formData.get('description') as string

    // Validate required fields
    if (!file) {
      return createErrorResponse(
        'MISSING_FILE',
        'File is required',
        400
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return createErrorResponse(
        'INVALID_FILE_TYPE',
        `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        400
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        'FILE_TOO_LARGE',
        `File size ${file.size} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
        400
      )
    }

    // Validate attachment type if provided
    if (attachmentType) {
      try {
        attachmentTypeSchema.parse(attachmentType)
      } catch {
        return createErrorResponse(
          'INVALID_ATTACHMENT_TYPE',
          'Invalid attachment type. Must be one of: instruction, drawing, photo, document',
          400
        )
      }
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Generate unique filename
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const fileExtension = path.extname(file.name)
    const savedFilename = `${fileId}${fileExtension}`
    const filePath = path.join(UPLOAD_DIR, savedFilename)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // TODO: Save file metadata to database (when file attachments service is implemented)
    // For now, return a mock response matching the API spec

    // Format response according to API spec
    const response = NextResponse.json({
      id: fileId,
      filename: savedFilename,
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
      attachmentType: attachmentType || 'document',
      workOrderOperationId: workOrderOperationId || null,
      routingOperationId: routingOperationId || null,
      description: description || null,
      uploadedAt: new Date().toISOString(),
      downloadUrl: `/api/v1/files/download/${fileId}`,
    }, { status: 201 })

    return addRateLimitHeaders(response, 99, Date.now() + 60000) // TODO: Get actual rate limit data
  } catch (error) {
    console.error('Error uploading file via external API:', error)

    if (error instanceof Error) {
      if (error.message.includes('Invalid attachment type')) {
        return createErrorResponse(
          'INVALID_ATTACHMENT_TYPE',
          'Invalid attachment type specified',
          400
        )
      }
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to upload file',
      500
    )
  }
}
