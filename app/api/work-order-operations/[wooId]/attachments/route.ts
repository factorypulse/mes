import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { WorkOrderOperationsService } from '@/lib/services/work-order-operations'

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
    const { fileRecord } = await request.json()

    // Get current WOO
    const woo = await WorkOrderOperationsService.getWOOById(wooId, user.selectedTeam?.id || '')
    if (!woo) {
      return NextResponse.json({ error: 'Work order operation not found' }, { status: 404 })
    }

    // Add file to attachments
    const currentAttachments = (woo as any).fileAttachments || []
    const updatedAttachments = [...currentAttachments, fileRecord]

    // Update WOO with new attachment
    const updatedWoo = await WorkOrderOperationsService.updateWOO(wooId, user.selectedTeam?.id || '', {
      fileAttachments: updatedAttachments
    } as any)

    return NextResponse.json(updatedWoo)
  } catch (error) {
    console.error('Error adding attachment:', error)
    return NextResponse.json(
      { error: 'Failed to add attachment' },
      { status: 500 }
    )
  }
}

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

    // Get current WOO
    const woo = await WorkOrderOperationsService.getWOOById(wooId, user.selectedTeam?.id || '')
    if (!woo) {
      return NextResponse.json({ error: 'Work order operation not found' }, { status: 404 })
    }

    return NextResponse.json((woo as any).fileAttachments || [])
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}