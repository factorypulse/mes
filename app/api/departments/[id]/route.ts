import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { DepartmentsService } from '@/lib/services/departments'

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
    const departmentsService = new DepartmentsService()
    const department = await departmentsService.getDepartmentById(id)

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error('Error fetching department:', error)
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const departmentsService = new DepartmentsService()
    const department = await departmentsService.updateDepartment(id, {
      name,
      description
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error('Error updating department:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const departmentsService = new DepartmentsService()
    await departmentsService.deleteDepartment(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting department:', error)
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 })
      }
      if (error.message.includes('existing operations')) {
        return NextResponse.json(
          { error: 'Cannot delete department with existing operations' },
          { status: 400 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    )
  }
}
