import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { DepartmentsService } from '@/lib/services/departments'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const departmentsService = new DepartmentsService()
    const departments = await departmentsService.getDepartmentsByTeam(teamId)

    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId, name, description } = body

    if (!teamId || !name) {
      return NextResponse.json(
        { error: 'Team ID and name are required' },
        { status: 400 }
      )
    }

    const departmentsService = new DepartmentsService()
    const department = await departmentsService.createDepartment(teamId, {
      name,
      description
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error('Error creating department:', error)
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, departmentIds, teamId } = body

    if (!action || !departmentIds || !Array.isArray(departmentIds)) {
      return NextResponse.json(
        { error: 'Action and department IDs are required' },
        { status: 400 }
      )
    }

    const departmentsService = new DepartmentsService()
    const results = []

    if (action === 'activate' || action === 'deactivate') {
      const isActive = action === 'activate'

      for (const id of departmentIds) {
        try {
          const department = await departmentsService.updateDepartment(id, {
            isActive
          })
          results.push({ id, success: true, department })
        } catch (error) {
          results.push({ id, success: false, error: 'Failed to update' })
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: activate, deactivate' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      results,
      processed: departmentIds.length
    })
  } catch (error) {
    console.error('Error bulk updating departments:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update departments' },
      { status: 500 }
    )
  }
}
