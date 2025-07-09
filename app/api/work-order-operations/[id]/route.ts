import { NextRequest, NextResponse } from 'next/server'
import { WorkOrderOperationsService } from '@/lib/services/work-order-operations'
import { stackServerApp } from '@/stack'

export async function GET(
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
    const woo = await WorkOrderOperationsService.getWOOById(params.id, teamId)

    if (!woo) {
      return NextResponse.json({ error: 'Work order operation not found' }, { status: 404 })
    }

    return NextResponse.json(woo)
  } catch (error) {
    console.error('Error fetching work order operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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

    // Convert date strings to Date objects
    const updateData = {
      ...body,
      scheduledStartTime: body.scheduledStartTime ? new Date(body.scheduledStartTime) : undefined,
      scheduledEndTime: body.scheduledEndTime ? new Date(body.scheduledEndTime) : undefined,
      actualStartTime: body.actualStartTime ? new Date(body.actualStartTime) : undefined,
      actualEndTime: body.actualEndTime ? new Date(body.actualEndTime) : undefined,
    }

    const woo = await WorkOrderOperationsService.updateWOO(params.id, teamId, updateData)

    if (!woo) {
      return NextResponse.json({ error: 'Work order operation not found' }, { status: 404 })
    }

    return NextResponse.json(woo)
  } catch (error) {
    console.error('Error updating work order operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
