import { NextRequest, NextResponse } from 'next/server'
import { WorkOrderOperationsService } from '@/lib/services/work-order-operations'
import { stackServerApp } from '@/stack'

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const operatorId = url.searchParams.get('operatorId')
    const departmentId = url.searchParams.get('departmentId')
    const type = url.searchParams.get('type') // 'operator' for operator dashboard

    let woos
    if (type === 'operator') {
      woos = await WorkOrderOperationsService.getOperatorWOOs(teamId, departmentId || undefined)
    } else {
      const statusArray = status ? status.split(',') : undefined
      woos = await WorkOrderOperationsService.getWOOsByTeam(teamId, statusArray, operatorId || undefined)
    }

    return NextResponse.json(woos)
  } catch (error) {
    console.error('Error fetching work order operations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
