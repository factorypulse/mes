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
    const { capturedData, quantityCompleted, quantityRejected, notes } = body

    const woo = await WorkOrderOperationsService.completeWOO(
      params.id,
      teamId,
      capturedData,
      quantityCompleted,
      quantityRejected,
      notes
    )

    if (!woo) {
      return NextResponse.json({ error: 'Work order operation not found or cannot be completed' }, { status: 404 })
    }

    return NextResponse.json(woo)
  } catch (error) {
    console.error('Error completing work order operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
