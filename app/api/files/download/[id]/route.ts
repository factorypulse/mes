import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Find the file by ID (this would normally be from a database)
    const uploadDir = join(process.cwd(), 'uploads')
    
    // For now, we'll construct the filename from the ID
    // In a real implementation, you'd look up the file metadata from the database
    const files = await readFile(join(uploadDir, `${id}.jpg`)).catch(() => null) ||
                  await readFile(join(uploadDir, `${id}.png`)).catch(() => null) ||
                  await readFile(join(uploadDir, `${id}.pdf`)).catch(() => null) ||
                  await readFile(join(uploadDir, `${id}.txt`)).catch(() => null)

    if (!files) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // In a real implementation, you'd get the mime type from the database
    const mimeType = 'application/octet-stream'
    
    return new NextResponse(files, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${id}"`
      }
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}