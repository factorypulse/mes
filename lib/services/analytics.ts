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

    // Get orders by status with 30-second cache for dashboard metrics
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
        },
        cacheStrategy: { swr: 30, ttl: 30 }
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
        },
        cacheStrategy: { swr: 30, ttl: 30 }
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
        },
        cacheStrategy: { swr: 30, ttl: 30 }
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
        },
        cacheStrategy: { swr: 30, ttl: 30 }
      })
    ])

    // Get completed orders today with cache
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
      },
      cacheStrategy: { swr: 30, ttl: 30 }
    })

    // Get operations counts with cache
    const [operationsInProgress, operationsPaused, completedOperationsToday] = await Promise.all([
      prisma.mESWorkOrderOperation.count({
        where: {
          order: { teamId },
          status: 'in_progress',
          ...departmentFilter
        },
        cacheStrategy: { swr: 30, ttl: 30 }
      }),
      prisma.mESWorkOrderOperation.count({
        where: {
          order: { teamId },
          status: 'paused',
          ...departmentFilter
        },
        cacheStrategy: { swr: 30, ttl: 30 }
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
        },
        cacheStrategy: { swr: 30, ttl: 30 }
      })
    ])

    // Calculate average cycle time (last 30 days) with longer cache since historical data
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
      },
      cacheStrategy: { swr: 120, ttl: 120 } // 2-minute cache for historical data
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

    // Get on-time delivery rate with cache since it's historical data
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
      },
      cacheStrategy: { swr: 120, ttl: 120 } // 2-minute cache for historical data
    })

    const onTimeOrders = ordersWithDueDate.filter(order =>
      order.scheduledEndDate && order.actualEndDate && order.actualEndDate <= order.scheduledEndDate
    ).length

    const onTimeDeliveryRate = ordersWithDueDate.length > 0
      ? Math.round((onTimeOrders / ordersWithDueDate.length) * 100)
      : 0

    // Get operator utilization with cache
    const [totalOperators, activeOperators] = await Promise.all([
      prisma.mESWorkOrderOperation.findMany({
        where: {
          order: { teamId },
          operatorId: { not: null }
        },
        select: {
          operatorId: true
        },
        distinct: ['operatorId'],
        cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for total operators
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
        distinct: ['operatorId'],
        cacheStrategy: { swr: 30, ttl: 30 } // 30-second cache for active operators
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

    // Get recent work order operations activity with short cache for real-time updates
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
      take: limit,
      cacheStrategy: { swr: 15, ttl: 15 } // 15-second cache for recent activity
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

  static async getPerformanceMetrics(userId: string, teamId: string): Promise<PerformanceAnalytics> {
    // Get user's accessible departments
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(userId, teamId)

    // Build department filter for queries
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      if (userAccessibleDepartments.length === 0) {
        // User has no department access, return empty performance data
        return {
          cycleTimeAnalysis: {
            averageCycleTime: 0,
            cycleTimeByDepartment: [],
            cycleTimeTrend: []
          },
          efficiency: {
            overallEfficiency: 0,
            efficiencyByDepartment: [],
            efficiencyTrend: []
          },
          throughput: {
            operationsPerHour: 0,
            throughputByDepartment: [],
            throughputTrend: []
          },
          qualityMetrics: {
            completionRate: 0,
            reworkRate: 0,
            onTimeDelivery: 0
          }
        }
      }

      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    // Calculate date ranges
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get completed operations for analysis with caching
    const completedOperations = await prisma.mESWorkOrderOperation.findMany({
      where: {
        order: { teamId },
        status: 'completed',
        actualStartTime: { not: null },
        actualEndTime: { not: null, gte: thirtyDaysAgo },
        ...departmentFilter
      },
      include: {
        order: {
          select: {
            quantity: true
          }
        },
        routingOperation: {
          include: {
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        pauseEvents: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        actualEndTime: 'desc'
      },
      cacheStrategy: { swr: 180, ttl: 180 } // 3-minute cache for performance analysis data
    })

    // Calculate cycle times
    const cycleTimeData = completedOperations.map(op => {
      if (!op.actualStartTime || !op.actualEndTime) return null

      const totalTime = op.actualEndTime.getTime() - op.actualStartTime.getTime()

      // Subtract pause time
      const pauseTime = op.pauseEvents.reduce((total, pause) => {
        if (pause.startTime && pause.endTime) {
          return total + (pause.endTime.getTime() - pause.startTime.getTime())
        }
        return total
      }, 0)

      const cycleTime = Math.max(0, totalTime - pauseTime) / 1000 / 60 // Convert to minutes

      return {
        operationId: op.id,
        departmentId: op.routingOperation.department?.id || '',
        departmentName: op.routingOperation.department?.name || 'Unknown',
        cycleTime,
        actualEndTime: op.actualEndTime,
        standardTime: op.routingOperation.runTime || 0,
        quantityCompleted: op.quantityCompleted || 0,
        quantityToProduce: op.order.quantity || 0
      }
    }).filter(Boolean) as NonNullable<typeof cycleTimeData[0]>[]

    // Calculate average cycle time
    const averageCycleTime = cycleTimeData.length > 0
      ? cycleTimeData.reduce((sum, op) => sum + op.cycleTime, 0) / cycleTimeData.length
      : 0

    // Calculate cycle time by department
    const cycleTimeByDepartment = cycleTimeData.reduce((acc, op) => {
      const dept = acc.find(d => d.departmentId === op.departmentId)
      if (dept) {
        dept.totalCycleTime += op.cycleTime
        dept.count++
        dept.averageCycleTime = dept.totalCycleTime / dept.count
      } else {
        acc.push({
          departmentId: op.departmentId,
          departmentName: op.departmentName,
          totalCycleTime: op.cycleTime,
          count: 1,
          averageCycleTime: op.cycleTime
        })
      }
      return acc
    }, [] as any[])

    // Calculate cycle time trend (daily averages for last 30 days)
    const cycleTimeTrend = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      date.setHours(0, 0, 0, 0)
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000)

      const dayOps = cycleTimeData.filter(op =>
        op.actualEndTime >= date && op.actualEndTime < nextDay
      )

      const avgCycleTime = dayOps.length > 0
        ? dayOps.reduce((sum, op) => sum + op.cycleTime, 0) / dayOps.length
        : 0

      cycleTimeTrend.push({
        date: date.toISOString().split('T')[0],
        averageCycleTime: Math.round(avgCycleTime * 100) / 100,
        operationsCount: dayOps.length
      })
    }

    // Calculate efficiency metrics
    const efficiencyData = cycleTimeData.map(op => {
      const efficiency = op.standardTime > 0 ? (op.standardTime / op.cycleTime) * 100 : 0
      return {
        ...op,
        efficiency: Math.min(efficiency, 200) // Cap at 200% efficiency
      }
    })

    const overallEfficiency = efficiencyData.length > 0
      ? efficiencyData.reduce((sum, op) => sum + op.efficiency, 0) / efficiencyData.length
      : 0

    // Calculate efficiency by department
    const efficiencyByDepartment = efficiencyData.reduce((acc, op) => {
      const dept = acc.find(d => d.departmentId === op.departmentId)
      if (dept) {
        dept.totalEfficiency += op.efficiency
        dept.count++
        dept.averageEfficiency = dept.totalEfficiency / dept.count
      } else {
        acc.push({
          departmentId: op.departmentId,
          departmentName: op.departmentName,
          totalEfficiency: op.efficiency,
          count: 1,
          averageEfficiency: op.efficiency
        })
      }
      return acc
    }, [] as any[])

    // Calculate throughput metrics
    const recentOperations = completedOperations.filter(op =>
      op.actualEndTime && op.actualEndTime >= sevenDaysAgo
    )

    const operationsPerHour = recentOperations.length > 0
      ? (recentOperations.length / (7 * 24)) // Operations per hour over last 7 days
      : 0

    // Calculate throughput by department
    const throughputByDepartment = recentOperations.reduce((acc, op) => {
      const deptId = op.routingOperation.department?.id || ''
      const deptName = op.routingOperation.department?.name || 'Unknown'

      const dept = acc.find(d => d.departmentId === deptId)
      if (dept) {
        dept.operationsCount++
      } else {
        acc.push({
          departmentId: deptId,
          departmentName: deptName,
          operationsCount: 1
        })
      }
      return acc
    }, [] as any[]).map(dept => ({
      ...dept,
      operationsPerHour: dept.operationsCount / (7 * 24)
    }))

    // Calculate quality metrics
    const totalOperations = completedOperations.length
    const completionRate = totalOperations > 0
      ? (completedOperations.filter(op => op.quantityCompleted >= (op.order.quantity || 0)).length / totalOperations) * 100
      : 0

    // Calculate on-time delivery with caching
    const ordersWithDueDate = await prisma.mESOrder.findMany({
      where: {
        teamId,
        status: 'completed',
        scheduledEndDate: { not: null },
        actualEndDate: { gte: thirtyDaysAgo }
      },
      select: {
        scheduledEndDate: true,
        actualEndDate: true
      },
      cacheStrategy: { swr: 180, ttl: 180 } // 3-minute cache for on-time delivery data
    })

    const onTimeOrders = ordersWithDueDate.filter(order =>
      order.scheduledEndDate && order.actualEndDate && order.actualEndDate <= order.scheduledEndDate
    ).length

    const onTimeDelivery = ordersWithDueDate.length > 0
      ? (onTimeOrders / ordersWithDueDate.length) * 100
      : 0

    return {
      cycleTimeAnalysis: {
        averageCycleTime: Math.round(averageCycleTime * 100) / 100,
        cycleTimeByDepartment: cycleTimeByDepartment.map(dept => ({
          departmentId: dept.departmentId,
          departmentName: dept.departmentName,
          averageCycleTime: Math.round(dept.averageCycleTime * 100) / 100,
          operationsCount: dept.count
        })),
        cycleTimeTrend
      },
      efficiency: {
        overallEfficiency: Math.round(overallEfficiency * 100) / 100,
        efficiencyByDepartment: efficiencyByDepartment.map(dept => ({
          departmentId: dept.departmentId,
          departmentName: dept.departmentName,
          averageEfficiency: Math.round(dept.averageEfficiency * 100) / 100,
          operationsCount: dept.count
        })),
        efficiencyTrend: cycleTimeTrend.map(day => ({
          date: day.date,
          efficiency: day.averageCycleTime > 0 ? Math.round((60 / day.averageCycleTime) * 100) / 100 : 0
        }))
      },
      throughput: {
        operationsPerHour: Math.round(operationsPerHour * 100) / 100,
        throughputByDepartment: throughputByDepartment.map(dept => ({
          departmentId: dept.departmentId,
          departmentName: dept.departmentName,
          operationsPerHour: Math.round(dept.operationsPerHour * 100) / 100,
          operationsCount: dept.operationsCount
        })),
        throughputTrend: cycleTimeTrend.map(day => ({
          date: day.date,
          operationsPerHour: day.operationsCount / 24,
          operationsCount: day.operationsCount
        }))
      },
      qualityMetrics: {
        completionRate: Math.round(completionRate * 100) / 100,
        reworkRate: 0, // Placeholder - would need rework tracking
        onTimeDelivery: Math.round(onTimeDelivery * 100) / 100
      }
    }
  }

  static async getWIPAnalytics(userId: string, teamId: string): Promise<WIPAnalytics> {
    // Get user's accessible departments
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(userId, teamId)

    // Build department filter for queries
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      if (userAccessibleDepartments.length === 0) {
        // User has no department access, return empty WIP data
        return {
          totalWipOperations: 0,
          wipByDepartment: [],
          wipByStatus: {
            pending: 0,
            in_progress: 0,
            paused: 0,
            waiting: 0
          },
          operationsBoard: [],
          bottlenecks: []
        }
      }

      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    // Get WIP operations by status with 1-minute cache
    const wipByStatus = await prisma.mESWorkOrderOperation.groupBy({
      by: ['status'],
      where: {
        order: { teamId },
        status: { in: ['pending', 'in_progress', 'paused', 'waiting'] },
        ...departmentFilter
      },
      _count: {
        id: true
      },
      cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for WIP status summary
    })

    // Get WIP operations with details for operations board
    const operationsBoard = await prisma.mESWorkOrderOperation.findMany({
      where: {
        order: { teamId },
        status: { in: ['pending', 'in_progress', 'paused', 'waiting'] },
        ...departmentFilter
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            quantity: true,
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
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'desc' },
        { updatedAt: 'desc' }
      ],
      cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for WIP operations board
    })

    // Calculate WIP by status from groupBy result
    const wipByStatusMap = wipByStatus.reduce((acc, item) => {
      acc[item.status as keyof typeof acc] = item._count.id || 0
      return acc
    }, {
      pending: 0,
      in_progress: 0,
      paused: 0,
      waiting: 0
    })

    // Get department details with caching
    const departments = await prisma.department.findMany({
      where: { teamId },
      select: {
        id: true,
        name: true
      },
      cacheStrategy: { swr: 300, ttl: 300 } // 5-minute cache for department data (static)
    })

    // Calculate bottlenecks - departments with high WIP counts
    const wipByDept = await prisma.mESWorkOrderOperation.groupBy({
      by: ['routingOperationId'],
      where: {
        order: { teamId },
        status: { in: ['pending', 'in_progress', 'paused', 'waiting'] },
        ...departmentFilter
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      cacheStrategy: { swr: 120, ttl: 120 } // 2-minute cache for bottleneck analysis
    })

    // Get routing operation details for bottleneck analysis
    const routingOperations = await prisma.mESRoutingOperation.findMany({
      where: {
        id: { in: wipByDept.map(w => w.routingOperationId) }
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      cacheStrategy: { swr: 300, ttl: 300 } // 5-minute cache for routing operations (static)
    })

    const bottlenecks = wipByDept.slice(0, 5).map(item => {
      const routingOp = routingOperations.find(ro => ro.id === item.routingOperationId)
      const wipCount = item._count.id || 0
      return {
        departmentId: routingOp?.department?.id || '',
        departmentName: routingOp?.department?.name || 'Unknown',
        operationName: routingOp?.operationName || 'Unknown',
        wipCount,
        severity: this.getSeverityLevel(wipCount)
      }
    })

    // Transform operations board data
    const boardData = operationsBoard.map(op => ({
      id: op.id,
      orderNumber: op.order.orderNumber,
      routingName: op.order.routing.name,
      operationName: op.routingOperation.operationName,
      operationNumber: op.routingOperation.operationNumber,
      department: op.routingOperation.department?.name || 'Unassigned',
      departmentId: op.routingOperation.department?.id || '',
      operatorName: op.operatorId ? `Operator ${op.operatorId.slice(0, 8)}` : 'Unassigned',
      status: op.status,
      quantityCompleted: op.quantityCompleted || 0,
      quantityToProduce: op.order.quantity || 0,
      actualStartTime: op.actualStartTime?.toISOString() || null,
      updatedAt: op.updatedAt.toISOString()
    }))

    // Calculate department WIP summary
    const deptWipSummary = departments.map(dept => {
      const deptOperations = boardData.filter(op => op.departmentId === dept.id)
      return {
        id: dept.id,
        name: dept.name,
        wipCount: deptOperations.length,
        inProgress: deptOperations.filter(op => op.status === 'in_progress').length,
        paused: deptOperations.filter(op => op.status === 'paused').length,
        pending: deptOperations.filter(op => op.status === 'pending').length,
        waiting: deptOperations.filter(op => op.status === 'waiting').length
      }
    }).filter(dept => dept.wipCount > 0)

    return {
      totalWipOperations: operationsBoard.length,
      wipByDepartment: deptWipSummary,
      wipByStatus: wipByStatusMap,
      operationsBoard: boardData,
      bottlenecks
    }
  }
}
