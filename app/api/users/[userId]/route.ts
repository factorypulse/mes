import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { UsersService, DepartmentAccess } from '@/lib/services/users'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const url = new URL(request.url)
    const teamId = url.searchParams.get('teamId') || user.selectedTeam?.id

    if (!teamId) {
      return NextResponse.json({ error: 'No team ID provided or selected' }, { status: 400 })
    }

    const userWithAccess = await UsersService.getUserWithDepartmentAccessForTeam(userId, teamId)

    if (!userWithAccess) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(userWithAccess)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const { userId } = await params
    const body = await request.json()
    const { departmentAccess }: { departmentAccess: DepartmentAccess } = body

    if (!departmentAccess) {
      return NextResponse.json(
        { error: 'Department access configuration is required' },
        { status: 400 }
      )
    }

    // Validate the department access structure
    if (typeof departmentAccess.allDepartments !== 'boolean') {
      return NextResponse.json(
        { error: 'allDepartments must be a boolean' },
        { status: 400 }
      )
    }

    if (!Array.isArray(departmentAccess.specificDepartments)) {
      return NextResponse.json(
        { error: 'specificDepartments must be an array' },
        { status: 400 }
      )
    }

    const updatedUser = await UsersService.assignDepartmentAccess(
      userId,
      teamId,
      departmentAccess
    )

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user department access:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('not a member')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to update user department access' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const { userId } = await params

    // Prevent users from removing themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from the team' },
        { status: 400 }
      )
    }

    await UsersService.removeUserFromTeam(userId, teamId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing user from team:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to remove user from team' },
      { status: 500 }
    )
  }
}
