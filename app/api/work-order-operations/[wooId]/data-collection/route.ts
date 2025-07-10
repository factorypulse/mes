import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { WorkOrderOperationsService } from '@/lib/services/work-order-operations'
import { DataCollectionActivitiesService } from '@/lib/services/data-collection-activities'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wooId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wooId } = await params

    // Get WOO details
    const woo = await WorkOrderOperationsService.getWOOById(wooId, user.selectedTeam?.id || '')
    if (!woo) {
      return NextResponse.json({ error: 'Work order operation not found' }, { status: 404 })
    }

    // Get data collection activities assigned to this routing operation
    const activities = await DataCollectionActivitiesService.getActivitiesByRoutingOperation(
      woo.routingOperation.id
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wooId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wooId } = await params
    const { collectedData } = await request.json()

    // Get WOO details
    const woo = await WorkOrderOperationsService.getWOOById(wooId, user.selectedTeam?.id || '')
    if (!woo) {
      return NextResponse.json({ error: 'Work order operation not found' }, { status: 404 })
    }

    // Save collected data to the WOO
    const updatedWoo = await WorkOrderOperationsService.updateWOO(wooId, user.selectedTeam?.id || '', {
      capturedData: collectedData
    })

    return NextResponse.json(updatedWoo)
  } catch (error) {
    console.error('Error saving data collection:', error)
    return NextResponse.json(
      { error: 'Failed to save data collection' },
      { status: 500 }
    )
  }
}