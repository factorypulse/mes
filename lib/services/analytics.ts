import { prisma } from '@/lib/prisma'
import { UsersService } from './users'

export interface DashboardMetrics {
  ordersPending: number
  ordersInProgress: number
  ordersPaused: number
  ordersWaiting: number
  ordersCompletedToday: number
  operationsInProgress: number
  operationsPaused: number
  completedOperationsToday: number
  averageCycleTime: number
  onTimeDeliveryRate: number
  operatorUtilization: number
  totalOperators: number
  activeOperators: number
}

export interface WIPAnalytics {
  totalWipOperations: number
  wipByDepartment: Array<{
    id: string
    name: string
    wipCount: number
    inProgress: number
    paused: number
    pending: number
    waiting: number
  }>
  wipByStatus: {
    pending: number
    in_progress: number
    paused: number
    waiting: number
  }
  operationsBoard: Array<{
    id: string
    orderNumber: string
    routingName: string
    operationName: string
    operationNumber: number
    department: string
    departmentId: string
    operatorName: string
    status: string
    quantityCompleted: number
    quantityToProduce: number
    actualStartTime: string | null
    updatedAt: string
  }>
  bottlenecks: Array<{
    departmentId: string
    departmentName: string
    operationName: string
    wipCount: number
    severity: 'high' | 'medium' | 'low'
  }>
}

export interface PerformanceAnalytics {
  cycleTimeAnalysis: {
    averageCycleTime: number
    cycleTimeByDepartment: Array<{
      departmentId: string
      departmentName: string
      averageCycleTime: number
      operationsCount: number
    }>
    cycleTimeTrend: Array<{
      date: string
      averageCycleTime: number
      operationsCount: number
    }>
  }
  efficiency: {
    overallEfficiency: number
    efficiencyByDepartment: Array<{
      departmentId: string
      departmentName: string
      averageEfficiency: number
      operationsCount: number
    }>
    efficiencyTrend: Array<{
      date: string
      efficiency: number
    }>
  }
  throughput: {
    operationsPerHour: number
    throughputByDepartment: Array<{
      departmentId: string
      departmentName: string
      operationsPerHour: number
      operationsCount: number
    }>
    throughputTrend: Array<{
      date: string
      operationsPerHour: number
      operationsCount: number
    }>
  }
  qualityMetrics: {
    completionRate: number
    reworkRate: number
    onTimeDelivery: number
  }
}

export interface RecentActivity {
  id: string
  orderNumber: string
  routingName: string
  operationName: string
  operationNumber: number
  department: string
  operatorName: string
  status: string
  statusColor: string
  activity: string
  timestamp: string
  quantityCompleted: number
}

export class AnalyticsService {
  static async getDashboardMetrics(userId: string, teamId: string): Promise<DashboardMetrics> {
    // Get user's accessible departments
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(userId, teamId)

    // Build department filter
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      if (userAccessibleDepartments.length === 0) {
        // User has no department access, return empty metrics
        return {
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
          operatorUtilization: 0,
          totalOperators: 0,
          activeOperators: 0
        }
      }

      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    // Calculate date range for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get orders by status
    const [ordersPending, ordersInProgress, ordersPaused, ordersWaiting] = await Promise.all([
      prisma.mESOrder.count({
        where: {
          teamId,
          status: 'pending',
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
      }),
      prisma.mESOrder.count({
        where: {
          teamId,
          status: 'in_progress',
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
      }),
      prisma.mESOrder.count({
        where: {
          teamId,
          status: 'paused',
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
      }),
      prisma.mESOrder.count({
        where: {
          teamId,
          status: 'waiting',
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
    ])

    // Get completed orders today
    const ordersCompletedToday = await prisma.mESOrder.count({
      where: {
        teamId,
        status: 'completed',
        actualEndDate: {
          gte: today,
          lt: tomorrow
        },
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

    // Get operations counts
    const [operationsInProgress, operationsPaused, completedOperationsToday] = await Promise.all([
      prisma.mESWorkOrderOperation.count({
        where: {
          order: { teamId },
          status: 'in_progress',
          ...departmentFilter
        }
      }),
      prisma.mESWorkOrderOperation.count({
        where: {
          order: { teamId },
          status: 'paused',
          ...departmentFilter
        }
      }),
      prisma.mESWorkOrderOperation.count({
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
    ])

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
        scheduledEndDate: { not: null },
        updatedAt: { gte: thirtyDaysAgo }
      },
      select: {
        scheduledEndDate: true,
        actualEndDate: true
      }
    })

    const onTimeOrders = ordersWithDueDate.filter(order =>
      order.scheduledEndDate && order.actualEndDate && order.actualEndDate <= order.scheduledEndDate
    ).length

    const onTimeDeliveryRate = ordersWithDueDate.length > 0
      ? Math.round((onTimeOrders / ordersWithDueDate.length) * 100)
      : 0

    // Get operator utilization
    const [totalOperators, activeOperators] = await Promise.all([
      prisma.mESWorkOrderOperation.findMany({
        where: {
          order: { teamId },
          operatorId: { not: null }
        },
        select: {
          operatorId: true
        },
        distinct: ['operatorId']
      }),
      prisma.mESWorkOrderOperation.findMany({
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
    ])

    const operatorUtilization = totalOperators.length > 0
      ? Math.round((activeOperators.length / totalOperators.length) * 100)
      : 0

    return {
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
    }
  }

  static async getRecentActivity(userId: string, teamId: string, limit: number = 10): Promise<RecentActivity[]> {
    // Get user's accessible departments
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(userId, teamId)

    // Build department filter
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      if (userAccessibleDepartments.length === 0) {
        return []
      }

      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    // Get recent work order operations activity
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
        }
      },
      orderBy: [
        { status: 'desc' },
        { actualEndTime: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: limit
    })

    // Transform the data
    return recentActivity.map(woo => {
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
        operatorName: woo.operatorId ? `Operator ${woo.operatorId.slice(0, 8)}` : 'Unassigned',
        status,
        statusColor,
        activity,
        timestamp: timestamp.toISOString(),
        quantityCompleted: woo.quantityCompleted || 0
      }
    })
  }

  static calculateCycleTime(
    startTime: Date,
    endTime: Date,
    pauseEvents: Array<{ startTime: Date | null; endTime: Date | null }>
  ): number {
    const totalTime = endTime.getTime() - startTime.getTime()
    
    const pauseTime = pauseEvents.reduce((total, pause) => {
      if (pause.startTime && pause.endTime) {
        return total + (pause.endTime.getTime() - pause.startTime.getTime())
      }
      return total
    }, 0)

    return Math.max(0, totalTime - pauseTime) / 1000 / 60 // Convert to minutes
  }

  static calculateEfficiency(standardTime: number, actualTime: number): number {
    if (actualTime <= 0) return 0
    return Math.min((standardTime / actualTime) * 100, 200) // Cap at 200%
  }

  static getSeverityLevel(count: number): 'high' | 'medium' | 'low' {
    if (count > 10) return 'high'
    if (count > 5) return 'medium'
    return 'low'
  }
}