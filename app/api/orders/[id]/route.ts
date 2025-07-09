import { NextRequest, NextResponse } from 'next/server'
import { OrdersService } from '@/lib/services/orders'
import { stackServerApp } from '@/stack'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const params = await context.params
    const order = await OrdersService.getOrderById(params.id, teamId)
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const params = await context.params
    const body = await request.json()
    
    // Convert date strings to Date objects
    const updateData = {
      ...body,
      scheduledStartDate: body.scheduledStartDate ? new Date(body.scheduledStartDate) : undefined,
      scheduledEndDate: body.scheduledEndDate ? new Date(body.scheduledEndDate) : undefined,
      actualStartDate: body.actualStartDate ? new Date(body.actualStartDate) : undefined,
      actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : undefined,
    }

    const order = await OrdersService.updateOrder(params.id, teamId, updateData)
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const params = await context.params
    const success = await OrdersService.deleteOrder(params.id, teamId)
    
    if (!success) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Order cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}