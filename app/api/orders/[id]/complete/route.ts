import { NextRequest, NextResponse } from 'next/server'
import { OrdersService } from '@/lib/services/orders'
import { stackServerApp } from '@/stack'

export async function POST(
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
    const order = await OrdersService.completeOrder(params.id, teamId)
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found or cannot be completed' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error completing order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}