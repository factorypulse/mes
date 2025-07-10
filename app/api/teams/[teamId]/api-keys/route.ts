import { NextRequest, NextResponse } from 'next/server'
import { APIKeysService } from '@/lib/services/api-keys'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createAPIKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    admin: z.boolean(),
  }).refine(data => data.read || data.write || data.admin, {
    message: 'At least one permission must be selected',
  }),
  expiresAt: z.string().datetime().optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await context.params

    // TODO: Verify user has access to this team
    // For now, we'll assume the session provides team access

    const apiKeys = await APIKeysService.getAPIKeysByTeam(teamId)

    return NextResponse.json({
      success: true,
      apiKeys,
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await context.params
    const body = await request.json()

    // Validate request body
    const validation = createAPIKeySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, description, permissions, expiresAt } = validation.data

    // TODO: Verify user has admin access to this team
    // For now, we'll assume the session provides team access

    // Create the API key
    const apiKey = await APIKeysService.createAPIKey({
      teamId,
      name,
      description,
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: session.user.id,
    })

    return NextResponse.json({
      success: true,
      apiKey,
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
