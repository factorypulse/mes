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
    const performanceMetrics = await AnalyticsService.getPerformanceMetrics(user.id, teamId)

    return NextResponse.json(performanceMetrics)
  } catch (error) {
    console.error('Error fetching performance analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance analytics' },
      { status: 500 }
    )
  }
}
