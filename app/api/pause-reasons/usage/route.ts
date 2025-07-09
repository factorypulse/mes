import { NextRequest, NextResponse } from 'next/server'
import { PauseReasonsService } from '@/lib/services/pause-reasons'
import { stackServerApp } from '@/stack'

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)

    // Parse date parameters
    let startDate: Date | undefined
    let endDate: Date | undefined

    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (startDateParam) {
      startDate = new Date(startDateParam)
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ error: 'Invalid startDate format' }, { status: 400 })
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam)
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid endDate format' }, { status: 400 })
      }
    }

    const usageStats = await PauseReasonsService.getPauseReasonUsage(
      user.selectedTeam?.id,
      startDate,
      endDate
    )

    return NextResponse.json(usageStats)
  } catch (error) {
    console.error('Error fetching pause reason usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
