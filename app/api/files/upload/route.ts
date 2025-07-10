import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const wooId = formData.get('wooId') as string
    const attachmentType = formData.get('attachmentType') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Generate unique filename
    const fileId = uuidv4()
    const extension = file.name.split('.').pop()
    const filename = `${fileId}.${extension}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads')
    await mkdir(uploadDir, { recursive: true })
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save file
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // Create file record
    const fileRecord = {
      id: fileId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: `/api/files/download/${fileId}`,
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
      attachmentType
    }

    // Update WOO with file attachment
    if (wooId) {
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/work-order-operations/${wooId}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || ''
        },
        body: JSON.stringify({ fileRecord })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to attach file to work order operation')
      }
    }

    return NextResponse.json(fileRecord, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}