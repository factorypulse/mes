import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { DataCollectionActivitiesService } from '@/lib/services/data-collection-activities'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const activities = await DataCollectionActivitiesService.getActivitiesByTeam(
      user.selectedTeam.id,
      activeOnly
    )

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching data collection activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data collection activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, fields } = body

    if (!name || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'Name and fields are required' },
        { status: 400 }
      )
    }

    // Validate fields structure
    for (const field of fields) {
      if (!field.id || !field.name || !field.label || !field.type) {
        return NextResponse.json(
          { error: 'Each field must have id, name, label, and type' },
          { status: 400 }
        )
      }
    }

    const activity = await DataCollectionActivitiesService.createActivity({
      name,
      description,
      fields,
      teamId: user.selectedTeam.id
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error creating data collection activity:', error)
    return NextResponse.json(
      { error: 'Failed to create data collection activity' },
      { status: 500 }
    )
  }
}