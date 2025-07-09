import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { DataCollectionActivitiesService } from '@/lib/services/data-collection-activities'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const params = await context.params
    const activity = await DataCollectionActivitiesService.getActivityById(
      params.id,
      user.selectedTeam.id
    )

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error fetching data collection activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data collection activity' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const params = await context.params
    const body = await request.json()
    const { name, description, fields, isActive } = body

    const activity = await DataCollectionActivitiesService.updateActivity(
      params.id,
      user.selectedTeam.id,
      { name, description, fields, isActive }
    )

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error updating data collection activity:', error)
    return NextResponse.json(
      { error: 'Failed to update data collection activity' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const params = await context.params
    const success = await DataCollectionActivitiesService.deleteActivity(
      params.id,
      user.selectedTeam.id
    )

    if (!success) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting data collection activity:', error)
    return NextResponse.json(
      { error: 'Failed to delete data collection activity' },
      { status: 500 }
    )
  }
}