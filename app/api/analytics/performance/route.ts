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

    // Build department filter for queries
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      if (userAccessibleDepartments.length === 0) {
        // User has no department access, return empty performance data
        return NextResponse.json({
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
        })
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
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get completed operations for analysis
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
      }
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
    }).filter(Boolean)

    // Calculate average cycle time
    const totalCycleTime = cycleTimeData.reduce((sum, op) => sum + (op?.cycleTime || 0), 0)
    const averageCycleTime = cycleTimeData.length > 0 ? totalCycleTime / cycleTimeData.length : 0

    // Calculate cycle time by department
    const cycleTimeByDepartment = cycleTimeData.reduce((acc, op) => {
      if (!op) return acc
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

    // Calculate cycle time trend (last 7 days)
    const cycleTimeTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const dayOperations = cycleTimeData.filter(op => 
        op && op.actualEndTime >= startOfDay && op.actualEndTime <= endOfDay
      )

      const avgCycleTime = dayOperations.length > 0 
        ? dayOperations.reduce((sum, op) => sum + (op?.cycleTime || 0), 0) / dayOperations.length
        : 0

      cycleTimeTrend.push({
        date: date.toISOString().split('T')[0],
        averageCycleTime: Math.round(avgCycleTime * 100) / 100,
        operationsCount: dayOperations.length
      })
    }

    // Calculate efficiency metrics
    const efficiencyData = cycleTimeData.filter((op): op is NonNullable<typeof op> => Boolean(op)).map(op => {
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
      if (!op) return acc
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

    // Calculate on-time delivery
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
      }
    })

    const onTimeOrders = ordersWithDueDate.filter(order =>
      order.scheduledEndDate && order.actualEndDate && order.actualEndDate <= order.scheduledEndDate
    ).length

    const onTimeDelivery = ordersWithDueDate.length > 0
      ? (onTimeOrders / ordersWithDueDate.length) * 100
      : 0

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Error fetching performance analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance analytics' },
      { status: 500 }
    )
  }
}