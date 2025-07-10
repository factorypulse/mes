import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { RoutingsService } from '@/lib/services/routings'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string; fileId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const { id, operationId, fileId } = await params

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting operation attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete operation attachment' },
      { status: 500 }
    )
  }
}