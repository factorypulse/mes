import { NextRequest, NextResponse } from 'next/server'
import { WorkOrderOperationsService } from '@/lib/services/work-order-operations'
import { stackServerApp } from '@/stack'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const params = await context.params
    const body = await request.json()
    const { pauseReasonId, notes } = body

    if (!pauseReasonId) {
      return NextResponse.json({ error: 'Pause reason is required' }, { status: 400 })
    }

    const woo = await WorkOrderOperationsService.pauseWOO(params.id, teamId, pauseReasonId, notes)

    if (!woo) {
      return NextResponse.json({ error: 'Work order operation not found or cannot be paused' }, { status: 404 })
    }

    return NextResponse.json(woo)
  } catch (error) {
    console.error('Error pausing work order operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
