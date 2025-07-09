import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { UsersService } from '@/lib/services/users'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const users = await UsersService.getTeamUsers(teamId)

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching team users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team users' },
      { status: 500 }
    )
  }
}
