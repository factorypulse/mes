import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { AnalyticsService } from '@/lib/services/analytics'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const teamId = user.selectedTeam.id

    // Use the cached analytics service instead of direct Prisma queries
    const recentActivity = await AnalyticsService.getRecentActivity(user.id, teamId, 10)

    return NextResponse.json(recentActivity)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
