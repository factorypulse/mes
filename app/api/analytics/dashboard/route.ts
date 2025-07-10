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

    // Calculate date range for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get user's accessible departments
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(user.id, teamId)

    // Build department filter for queries
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      if (userAccessibleDepartments.length === 0) {
        // User has no department access, return empty metrics
        return NextResponse.json({
          ordersPending: 0,
          ordersInProgress: 0,
          ordersPaused: 0,
          ordersWaiting: 0,
          ordersCompletedToday: 0,
          operationsInProgress: 0,
          operationsPaused: 0,
          completedOperationsToday: 0,
          averageCycleTime: 0,
          onTimeDeliveryRate: 0,
          operatorUtilization: 0
        })
      }

      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    // Get orders by status
    const ordersPending = await prisma.mESOrder.count({
      where: {
        teamId,
        status: 'pending',
        // Filter by user's accessible departments
        ...(userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments) && {
          workOrderOperations: {
            some: {
              routingOperation: {
                departmentId: { in: userAccessibleDepartments }
              }
            }
          }
        })
      }
    })

    const ordersInProgress = await prisma.mESOrder.count({
      where: {
        teamId,
        status: 'in_progress',
        // Filter by user's accessible departments
        ...(userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments) && {
          workOrderOperations: {
            some: {
              routingOperation: {
                departmentId: { in: userAccessibleDepartments }
              }
            }
          }
        })
      }
    })

    const ordersPaused = await prisma.mESOrder.count({
      where: {
        teamId,
        status: 'paused',
        // Filter by user's accessible departments
        ...(userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments) && {
          workOrderOperations: {
            some: {
              routingOperation: {
                departmentId: { in: userAccessibleDepartments }
              }
            }
          }
        })
      }
    })

    const ordersWaiting = await prisma.mESOrder.count({
      where: {
        teamId,
        status: 'waiting',
        // Filter by user's accessible departments
        ...(userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments) && {
          workOrderOperations: {
            some: {
              routingOperation: {
                departmentId: { in: userAccessibleDepartments }
              }
            }
          }
        })
      }
    })

    // Get completed orders today
    const ordersCompletedToday = await prisma.mESOrder.count({
      where: {
        teamId,
        status: 'completed',
        actualEndDate: {
          gte: today,
          lt: tomorrow
        },
        // Filter by user's accessible departments
        ...(userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments) && {
          workOrderOperations: {
            some: {
              routingOperation: {
                departmentId: { in: userAccessibleDepartments }
              }
            }
          }
        })
      }
    })

    // Get operations in progress
    const operationsInProgress = await prisma.mESWorkOrderOperation.count({
      where: {
        order: { teamId },
        status: 'in_progress',
        ...departmentFilter
      }
    })

    // Get paused operations
    const operationsPaused = await prisma.mESWorkOrderOperation.count({
      where: {
        order: { teamId },
        status: 'paused',
        ...departmentFilter
      }
    })

    // Get completed operations today
    const completedOperationsToday = await prisma.mESWorkOrderOperation.count({
      where: {
        order: { teamId },
        status: 'completed',
        actualEndTime: {
          gte: today,
          lt: tomorrow
        },
        ...departmentFilter
      }
    })

    // Calculate average cycle time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const completedOperations = await prisma.mESWorkOrderOperation.findMany({
      where: {
        order: { teamId },
        status: 'completed',
        actualStartTime: { not: null },
        actualEndTime: {
          not: null,
          gte: thirtyDaysAgo
        },
        ...departmentFilter
      },
      select: {
        actualStartTime: true,
        actualEndTime: true,
        pauseEvents: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      }
    })

    const totalCycleTime = completedOperations.reduce((total, op) => {
      if (!op.actualStartTime || !op.actualEndTime) return total

      const totalTime = op.actualEndTime.getTime() - op.actualStartTime.getTime()

      // Subtract pause time
      const pauseTime = op.pauseEvents.reduce((pauseTotal, pause) => {
        if (pause.startTime && pause.endTime) {
          return pauseTotal + (pause.endTime.getTime() - pause.startTime.getTime())
        }
        return pauseTotal
      }, 0)

      return total + (totalTime - pauseTime)
    }, 0)

    const averageCycleTime = completedOperations.length > 0
      ? Math.round(totalCycleTime / completedOperations.length / 1000 / 60) // Convert to minutes
      : 0

    // Get on-time delivery rate
    const ordersWithDueDate = await prisma.mESOrder.findMany({
      where: {
        teamId,
        status: 'completed',
        scheduledStartDate: { not: null },
        updatedAt: { gte: thirtyDaysAgo }
      },
      select: {
        scheduledStartDate: true,
        updatedAt: true
      }
    })

    const onTimeOrders = ordersWithDueDate.filter(order =>
      order.scheduledStartDate && order.updatedAt <= order.scheduledStartDate
    ).length

    const onTimeDeliveryRate = ordersWithDueDate.length > 0
      ? Math.round((onTimeOrders / ordersWithDueDate.length) * 100)
      : 0

    // Get operator utilization (active vs total operators)
    // Since users are managed by StackAuth, we'll count distinct operators from work order operations
    const totalOperators = await prisma.mESWorkOrderOperation.findMany({
      where: {
        order: { teamId },
        operatorId: { not: null }
      },
      select: {
        operatorId: true
      },
      distinct: ['operatorId']
    })

    const activeOperators = await prisma.mESWorkOrderOperation.findMany({
      where: {
        order: { teamId },
        status: 'in_progress',
        operatorId: { not: null }
      },
      select: {
        operatorId: true
      },
      distinct: ['operatorId']
    })

    const operatorUtilization = totalOperators.length > 0
      ? Math.round((activeOperators.length / totalOperators.length) * 100)
      : 0

    return NextResponse.json({
      ordersPending,
      ordersInProgress,
      ordersPaused,
      ordersWaiting,
      ordersCompletedToday,
      operationsInProgress,
      operationsPaused,
      completedOperationsToday,
      averageCycleTime,
      onTimeDeliveryRate,
      operatorUtilization,
      totalOperators: totalOperators.length,
      activeOperators: activeOperators.length
    })
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    )
  }
}
