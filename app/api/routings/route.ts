import { NextRequest, NextResponse } from 'next/server'
import { RoutingsService } from '@/lib/services/routings'
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
    const activeOnly = url.searchParams.get('activeOnly') !== 'false'

    const routings = await RoutingsService.getRoutingsByTeam(teamId, activeOnly)
    
    return NextResponse.json(routings)
  } catch (error) {
    console.error('Error fetching routings:', error)
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
    const routingData = {
      ...body,
      teamId
    }

    const routing = await RoutingsService.createRouting(routingData)
    
    return NextResponse.json(routing, { status: 201 })
  } catch (error) {
    console.error('Error creating routing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}