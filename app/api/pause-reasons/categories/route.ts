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

    const categoryCounts = await PauseReasonsService.getPauseReasonCategoryCounts(
      user.selectedTeam.id
    )

    return NextResponse.json(categoryCounts)
  } catch (error) {
    console.error('Error fetching pause reason category counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
