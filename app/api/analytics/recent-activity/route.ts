import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { UsersService } from '@/lib/services/users'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const teamId = user.selectedTeam.id

    // Get user's accessible departments
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(user.id, teamId)

    // Build department filter
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      if (userAccessibleDepartments.length === 0) {
        // User has no department access, return empty activity
        return NextResponse.json([])
      }

      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    // Get recent work order operations activity, prioritizing completions
    const recentActivity = await prisma.mESWorkOrderOperation.findMany({
      where: {
        order: { teamId },
        ...departmentFilter
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            routing: {
              select: {
                name: true
              }
            }
          }
        },
        routingOperation: {
          select: {
            operationName: true,
            operationNumber: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        operator: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        // Prioritize completed operations first, then by most recent activity
        { status: 'desc' }, // completed comes before in_progress alphabetically
        { actualEndTime: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: 10
    })

    // Transform the data for the dashboard
    const activities = recentActivity.map(woo => {
      let status = 'pending'
      let statusColor = 'secondary'
      let activity = 'Pending'
      let timestamp = woo.createdAt

      if (woo.status === 'in_progress') {
        status = 'in_progress'
        statusColor = 'default'
        activity = 'Started'
        timestamp = woo.actualStartTime || woo.updatedAt
      } else if (woo.status === 'completed') {
        status = 'completed'
        statusColor = 'outline'
        activity = 'Completed'
        timestamp = woo.actualEndTime || woo.updatedAt
      } else if (woo.status === 'paused') {
        status = 'paused'
        statusColor = 'destructive'
        activity = 'Paused'
        timestamp = woo.updatedAt
      }

      return {
        id: woo.id,
        orderNumber: woo.order.orderNumber,
        routingName: woo.order.routing.name,
        operationName: woo.routingOperation.operationName,
        operationNumber: woo.routingOperation.operationNumber,
        department: woo.routingOperation.department?.name || 'Unassigned',
        operatorName: woo.operator?.name || (woo.operatorId ? `Operator ${woo.operatorId.slice(0, 8)}` : 'Unassigned'),
        status,
        statusColor,
        activity,
        timestamp: timestamp.toISOString(),
        quantityCompleted: woo.quantityCompleted || 0
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
