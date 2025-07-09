import { NextRequest, NextResponse } from 'next/server'
import { RoutingsService } from '@/lib/services/routings'
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
    const routing = await RoutingsService.getRoutingById(params.id, teamId)
    
    if (!routing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    return NextResponse.json(routing)
  } catch (error) {
    console.error('Error fetching routing:', error)
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
    const routing = await RoutingsService.updateRouting(params.id, teamId, body)
    
    if (!routing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    return NextResponse.json(routing)
  } catch (error) {
    console.error('Error updating routing:', error)
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
    const success = await RoutingsService.deleteRouting(params.id, teamId)
    
    if (!success) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Routing deleted successfully' })
  } catch (error) {
    console.error('Error deleting routing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}