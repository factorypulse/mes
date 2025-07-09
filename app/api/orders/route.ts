import { NextRequest, NextResponse } from 'next/server'
import { OrdersService } from '@/lib/services/orders'
import { stackServerApp } from '@/stack'

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status') || undefined

    const orders = await OrdersService.getOrdersByTeam(teamId, status)
    
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamId = user.selectedTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const body = await request.json()
    const orderData = {
      ...body,
      teamId,
      scheduledStartDate: body.scheduledStartDate ? new Date(body.scheduledStartDate) : undefined,
      scheduledEndDate: body.scheduledEndDate ? new Date(body.scheduledEndDate) : undefined,
    }

    const order = await OrdersService.createOrder(orderData)
    
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}