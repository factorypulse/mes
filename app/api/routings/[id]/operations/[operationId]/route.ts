import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { RoutingsService } from '@/lib/services/routings'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const body = await request.json()
    
    // Get teamId from user
    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 401 })
    }
    
    const operation = await RoutingsService.updateRoutingOperation(
      params.operationId,
      user.selectedTeam.id,
      body
    )

    return NextResponse.json(operation)
  } catch (error) {
    console.error('Error updating operation:', error)
    return NextResponse.json(
      { error: 'Failed to update operation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    
    // Get teamId from user
    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 401 })
    }
    
    await RoutingsService.deleteRoutingOperation(params.operationId, user.selectedTeam.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting operation:', error)
    return NextResponse.json(
      { error: 'Failed to delete operation' },
      { status: 500 }
    )
  }
}