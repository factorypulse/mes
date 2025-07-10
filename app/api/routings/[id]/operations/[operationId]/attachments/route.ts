import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { RoutingsService } from '@/lib/services/routings'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const { id, operationId } = await params

    // Get the routing and operation
    const routing = await RoutingsService.getRoutingById(id, user.selectedTeam.id)
    if (!routing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    const operation = (routing as any).operations?.find((op: any) => op.id === operationId)
    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 })
    }

    // Return the attachments from the operation
    const attachments = operation.fileAttachments || []
    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching operation attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operation attachments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const { id, operationId } = await params
    const { fileRecord } = await request.json()

    // Get the routing and operation
    const routing = await RoutingsService.getRoutingById(id, user.selectedTeam.id)
    if (!routing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    const operation = (routing as any).operations?.find((op: any) => op.id === operationId)
    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 })
    }

    // Add the file to the operation's attachments
    const currentAttachments = operation.fileAttachments || []
    const updatedAttachments = [...currentAttachments, fileRecord]

    // Update the operation with the new attachment
    const updatedOperation = await RoutingsService.updateRoutingOperation(
      operationId,
      user.selectedTeam.id,
      {
        fileAttachments: updatedAttachments
      }
    )

    return NextResponse.json(updatedOperation)
  } catch (error) {
    console.error('Error adding operation attachment:', error)
    return NextResponse.json(
      { error: 'Failed to add operation attachment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const { id, operationId } = await params
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get the routing and operation
    const routing = await RoutingsService.getRoutingById(id, user.selectedTeam.id)
    if (!routing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    const operation = (routing as any).operations?.find((op: any) => op.id === operationId)
    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 })
    }

    // Remove the file from the operation's attachments
    const currentAttachments = operation.fileAttachments || []
    const updatedAttachments = currentAttachments.filter((file: any) => file.id !== fileId)

    // Update the operation
    const updatedOperation = await RoutingsService.updateRoutingOperation(
      operationId,
      user.selectedTeam.id,
      {
        fileAttachments: updatedAttachments
      }
    )

    return NextResponse.json(updatedOperation)
  } catch (error) {
    console.error('Error deleting operation attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete operation attachment' },
      { status: 500 }
    )
  }
}