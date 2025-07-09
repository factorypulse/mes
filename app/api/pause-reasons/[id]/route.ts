import { NextRequest, NextResponse } from 'next/server'
import { PauseReasonsService } from '@/lib/services/pause-reasons'
import { stackServerApp } from '@/stack'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const pauseReason = await PauseReasonsService.getPauseReasonById(
      params.id,
      user.selectedTeamId
    )

    if (!pauseReason) {
      return NextResponse.json({ error: 'Pause reason not found' }, { status: 404 })
    }

    return NextResponse.json(pauseReason)
  } catch (error) {
    console.error('Error fetching pause reason:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, category, isActive } = body

    // Validate category if provided
    if (category) {
      const validCategories = ['planned', 'unplanned', 'maintenance', 'quality', 'material', 'other']
      if (!validCategories.includes(category)) {
        return NextResponse.json({
          error: 'Invalid category. Must be one of: ' + validCategories.join(', ')
        }, { status: 400 })
      }
    }

    const updatedPauseReason = await PauseReasonsService.updatePauseReason(
      params.id,
      user.selectedTeamId,
      { name, description, category, isActive }
    )

    if (!updatedPauseReason) {
      return NextResponse.json({ error: 'Pause reason not found' }, { status: 404 })
    }

    return NextResponse.json(updatedPauseReason)
  } catch (error) {
    console.error('Error updating pause reason:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const success = await PauseReasonsService.deletePauseReason(
      params.id,
      user.selectedTeamId
    )

    if (!success) {
      return NextResponse.json({ error: 'Pause reason not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Pause reason deleted successfully' })
  } catch (error) {
    console.error('Error deleting pause reason:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
