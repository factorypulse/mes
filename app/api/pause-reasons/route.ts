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
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const category = searchParams.get('category')

    let pauseReasons

    if (category) {
      pauseReasons = await PauseReasonsService.getPauseReasonsByCategory(
        user.selectedTeam?.id,
        category,
        activeOnly
      )
    } else {
      pauseReasons = await PauseReasonsService.getPauseReasonsByTeam(
        user.selectedTeam?.id,
        activeOnly
      )
    }

    return NextResponse.json(pauseReasons)
  } catch (error) {
    console.error('Error fetching pause reasons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, category } = body

    if (!name || !category) {
      return NextResponse.json({
        error: 'Name and category are required'
      }, { status: 400 })
    }

    const validCategories = ['planned', 'unplanned', 'maintenance', 'quality', 'material', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json({
        error: 'Invalid category. Must be one of: ' + validCategories.join(', ')
      }, { status: 400 })
    }

    const pauseReason = await PauseReasonsService.createPauseReason({
      name,
      description,
      category,
      teamId: user.selectedTeam?.id
    })

    return NextResponse.json(pauseReason, { status: 201 })
  } catch (error) {
    console.error('Error creating pause reason:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
