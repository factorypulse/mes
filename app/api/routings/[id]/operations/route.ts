import { NextRequest, NextResponse } from 'next/server'
import { RoutingsService } from '@/lib/services/routings'
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
    const body = await request.json()
    const operation = await RoutingsService.addOperationToRouting(params.id, teamId, body)
    
    if (!operation) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    return NextResponse.json(operation, { status: 201 })
  } catch (error) {
    console.error('Error adding operation to routing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}