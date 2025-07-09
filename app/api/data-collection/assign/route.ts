import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { DataCollectionActivitiesService } from '@/lib/services/data-collection-activities'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { routingOperationId, dataCollectionActivityId, isRequired, sequence } = body

    if (!routingOperationId || !dataCollectionActivityId) {
      return NextResponse.json(
        { error: 'routingOperationId and dataCollectionActivityId are required' },
        { status: 400 }
      )
    }

    const assignment = await DataCollectionActivitiesService.assignActivityToOperation({
      routingOperationId,
      dataCollectionActivityId,
      isRequired,
      sequence
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Error assigning activity to operation:', error)
    return NextResponse.json(
      { error: 'Failed to assign activity to operation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const routingOperationId = searchParams.get('routingOperationId')
    const dataCollectionActivityId = searchParams.get('dataCollectionActivityId')

    if (!routingOperationId || !dataCollectionActivityId) {
      return NextResponse.json(
        { error: 'routingOperationId and dataCollectionActivityId are required' },
        { status: 400 }
      )
    }

    const success = await DataCollectionActivitiesService.removeActivityFromOperation(
      routingOperationId,
      dataCollectionActivityId
    )

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error removing activity from operation:', error)
    return NextResponse.json(
      { error: 'Failed to remove activity from operation' },
      { status: 500 }
    )
  }
}