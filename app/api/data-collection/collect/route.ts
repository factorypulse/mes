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
    const { workOrderOperationId, dataCollectionActivityId, collectedData } = body

    if (!workOrderOperationId || !dataCollectionActivityId || !collectedData) {
      return NextResponse.json(
        { error: 'workOrderOperationId, dataCollectionActivityId, and collectedData are required' },
        { status: 400 }
      )
    }

    const collection = await DataCollectionActivitiesService.collectData({
      workOrderOperationId,
      dataCollectionActivityId,
      collectedData,
      operatorId: user.id
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error('Error collecting data:', error)
    return NextResponse.json(
      { error: 'Failed to collect data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workOrderOperationId = searchParams.get('workOrderOperationId')

    if (!workOrderOperationId) {
      return NextResponse.json(
        { error: 'workOrderOperationId is required' },
        { status: 400 }
      )
    }

    const collections = await DataCollectionActivitiesService.getCollectedDataForWOO(
      workOrderOperationId
    )

    return NextResponse.json(collections)
  } catch (error) {
    console.error('Error fetching collected data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collected data' },
      { status: 500 }
    )
  }
}