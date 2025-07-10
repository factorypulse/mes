import { NextRequest, NextResponse } from 'next/server'
import { APIKeysService } from '@/lib/services/api-keys'
import { auth } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ teamId: string; id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, id } = await context.params

    // TODO: Verify user has admin access to this team
    // For now, we'll assume the session provides team access

    // Verify the API key exists and belongs to the team
    const apiKey = await APIKeysService.getAPIKeyById(id, teamId)
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    // Revoke the API key
    const success = await APIKeysService.revokeAPIKey(id, teamId)
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teamId: string; id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, id } = await context.params

    // TODO: Verify user has access to this team
    // For now, we'll assume the session provides team access

    const apiKey = await APIKeysService.getAPIKeyById(id, teamId)
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      apiKey,
    })
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    )
  }
}
