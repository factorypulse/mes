import { NextRequest, NextResponse } from 'next/server'
import { WorkOrderOperationsService, WOOWithRelations } from '@/lib/services/work-order-operations'
import { UsersService } from '@/lib/services/users'
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

        // Get user's accessible departments
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(user.id, teamId)

    let woos: WOOWithRelations[]
    if (type === 'operator') {
      // For operator dashboard, filter by user's accessible departments
      if (userAccessibleDepartments === 'all') {
        // User has access to all departments, no filtering needed
        woos = await WorkOrderOperationsService.getOperatorWOOs(teamId, departmentId || undefined)
      } else if (Array.isArray(userAccessibleDepartments) && userAccessibleDepartments.length > 0) {
        // User has access to specific departments
        if (departmentId) {
          // Check if requested department is in user's accessible departments
          if (userAccessibleDepartments.includes(departmentId)) {
            woos = await WorkOrderOperationsService.getOperatorWOOs(teamId, departmentId)
          } else {
            // User doesn't have access to requested department
            woos = []
          }
        } else {
          // No specific department requested, get WOOs from all accessible departments
          woos = await WorkOrderOperationsService.getWOOsByDepartments(teamId, userAccessibleDepartments, ['pending', 'paused'])
        }
      } else {
        // User has no department access
        woos = []
      }
    } else {
      // For general WOO queries, apply department filtering
      const statusArray = status ? status.split(',') : undefined

      if (userAccessibleDepartments === 'all') {
        // User has access to all departments, no filtering needed
        woos = await WorkOrderOperationsService.getWOOsByTeam(teamId, statusArray, operatorId || undefined)
      } else if (Array.isArray(userAccessibleDepartments) && userAccessibleDepartments.length > 0) {
        // User has access to specific departments, filter accordingly
        woos = await WorkOrderOperationsService.getWOOsByDepartments(teamId, userAccessibleDepartments, statusArray, operatorId || undefined)
      } else {
        // User has no department access
        woos = []
      }
    }

    return NextResponse.json(woos)
  } catch (error) {
    console.error('Error fetching work order operations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'migrate-sequential-operations') {
      await WorkOrderOperationsService.migrateToSequentialOperations(teamId)
      return NextResponse.json({ success: true, message: 'Migration completed successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in work order operations POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
