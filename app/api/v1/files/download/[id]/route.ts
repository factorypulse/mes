import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest, createErrorResponse } from '@/lib/middleware/external-api-auth'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Configuration
const UPLOAD_DIR = './uploads'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Validate API authentication
  const authResult = await validateExternalAPIRequest(request)
  if (!authResult.success) {
    return authResult.error
  }

  const { context: authContext } = authResult
  const { id } = await context.params

  try {
    // TODO: Get file metadata from database to verify permissions and get original filename
    // For now, we'll work with the file system directly

    // Find file with the given ID prefix
    const files = require('fs').readdirSync(UPLOAD_DIR)
    const matchingFile = files.find((filename: string) => filename.startsWith(id))

    if (!matchingFile) {
      return createErrorResponse(
        'FILE_NOT_FOUND',
        'File not found or access denied',
        404
      )
    }

    const filePath = path.join(UPLOAD_DIR, matchingFile)

    // Verify file exists
    if (!existsSync(filePath)) {
      return createErrorResponse(
        'FILE_NOT_FOUND',
        'File not found on disk',
        404
      )
    }

    // Read file from disk
    const fileBuffer = await readFile(filePath)

    // Determine content type based on file extension
    const fileExtension = path.extname(matchingFile).toLowerCase()
    let contentType = 'application/octet-stream'

    switch (fileExtension) {
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.txt':
        contentType = 'text/plain'
        break
      case '.doc':
        contentType = 'application/msword'
        break
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
    }

    // Create response with file data
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${matchingFile}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })

    return response
  } catch (error) {
    console.error('Error downloading file via external API:', error)

    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return createErrorResponse(
          'FILE_NOT_FOUND',
          'File not found on disk',
          404
        )
      }
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to download file',
      500
    )
  }
}
