import { prisma } from '@/lib/prisma'
import { UsersService } from './users'

export interface ExportData {
  title: string
  headers: string[]
  rows: (string | number | null)[][]
  metadata: {
    generatedAt: string
    filters: any
    teamId: string
  }
}

export interface ExportOptions {
  format: 'csv' | 'json'
  dateRange?: string
  departments?: string[]
  customStartDate?: Date
  customEndDate?: Date
}

export class ExportService {
  /**
   * Export dashboard metrics as CSV or JSON
   */
  static async exportDashboardMetrics(
    userId: string,
    teamId: string,
    options: ExportOptions
  ): Promise<ExportData> {
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(userId, teamId)

    // Get date range
    const { startDate, endDate } = this.getDateRange(options.dateRange, options.customStartDate, options.customEndDate)

    // Build department filter
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    // Apply additional department filter from options
    if (options.departments && options.departments.length > 0) {
      if (departmentFilter.routingOperation) {
        departmentFilter.routingOperation.departmentId = {
          in: departmentFilter.routingOperation.departmentId.in.filter((id: string) =>
            options.departments!.includes(id)
          )
        }
      } else {
        departmentFilter = {
          routingOperation: {
            departmentId: { in: options.departments }
          }
        }
      }
    }

    // Get orders data
    const orders = await prisma.mESOrder.findMany({
      where: {
        teamId,
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        routing: {
          select: {
            name: true
          }
        },
        workOrderOperations: {
          where: departmentFilter,
          include: {
            routingOperation: {
              include: {
                department: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      cacheStrategy: { swr: 180, ttl: 180 } // 3-minute cache for export data
    })

    const headers = [
      'Order Number',
      'Product',
      'Quantity',
      'Routing',
      'Status',
      'Created Date',
      'Started Date',
      'Completed Date',
      'Cycle Time (hours)',
      'Operations Count',
      'Operations Completed'
    ]

    const rows = orders.map(order => {
      const totalOperations = order.workOrderOperations.length
      const completedOperations = order.workOrderOperations.filter(woo => woo.status === 'completed').length

      // Calculate total cycle time
      let totalCycleTime = 0
      if (order.actualStartDate && order.actualEndDate) {
        totalCycleTime = (order.actualEndDate.getTime() - order.actualStartDate.getTime()) / (1000 * 60 * 60)
      }

      return [
        order.orderNumber,
        (order as any).productIdentifier || '',
        order.quantity,
        order.routing.name,
        order.status,
        order.createdAt.toISOString().split('T')[0],
        order.actualStartDate?.toISOString().split('T')[0] || '',
        order.actualEndDate?.toISOString().split('T')[0] || '',
        totalCycleTime.toFixed(2),
        totalOperations,
        completedOperations
      ]
    })

    return {
      title: 'Dashboard Metrics Export',
      headers,
      rows,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: options,
        teamId
      }
    }
  }

  /**
   * Export performance metrics
   */
  static async exportPerformanceMetrics(
    userId: string,
    teamId: string,
    options: ExportOptions
  ): Promise<ExportData> {
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(userId, teamId)
    const { startDate, endDate } = this.getDateRange(options.dateRange, options.customStartDate, options.customEndDate)

    // Build department filter
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    if (options.departments && options.departments.length > 0) {
      if (departmentFilter.routingOperation) {
        departmentFilter.routingOperation.departmentId = {
          in: departmentFilter.routingOperation.departmentId.in.filter((id: string) =>
            options.departments!.includes(id)
          )
        }
      } else {
        departmentFilter = {
          routingOperation: {
            departmentId: { in: options.departments }
          }
        }
      }
    }

    // Get completed operations
    const operations = await prisma.mESWorkOrderOperation.findMany({
      where: {
        order: { teamId },
        status: 'completed',
        actualStartTime: { not: null },
        actualEndTime: {
          not: null,
          gte: startDate,
          lte: endDate
        },
        ...departmentFilter
      },
      include: {
        order: {
          select: {
            orderNumber: true
          }
        },
        routingOperation: {
          include: {
            department: {
              select: {
                name: true
              }
            }
          }
        },
        pauseEvents: {
          select: {
            startTime: true,
            endTime: true,
            pauseReason: true
          }
        }
      },
      orderBy: {
        actualEndTime: 'desc'
      },
      cacheStrategy: { swr: 300, ttl: 300 } // 5-minute cache for performance export data
    })

    const headers = [
      'Order Number',
      'Product',
      'Operation Name',
      'Department',
      'Operator ID',
      'Start Time',
      'End Time',
      'Cycle Time (minutes)',
      'Standard Time (minutes)',
      'Efficiency %',
      'Pause Time (minutes)',
      'Pause Count',
      'Quantity Completed'
    ]

    const rows = operations.map(op => {
      if (!op.actualStartTime || !op.actualEndTime) return []

      const totalTime = op.actualEndTime.getTime() - op.actualStartTime.getTime()

      // Calculate pause time
      const pauseTime = op.pauseEvents.reduce((total, pause) => {
        if (pause.startTime && pause.endTime) {
          return total + (pause.endTime.getTime() - pause.startTime.getTime())
        }
        return total
      }, 0)

      const cycleTime = Math.max(0, totalTime - pauseTime) / 1000 / 60 // Convert to minutes
      const standardTime = op.routingOperation.runTime || 0
      const efficiency = standardTime > 0 ? (standardTime / cycleTime) * 100 : 0

      return [
        op.order.orderNumber,
        (op.order as any).productIdentifier || '',
        op.routingOperation.operationName,
        op.routingOperation.department?.name || 'Unassigned',
        op.operatorId || 'Unassigned',
        op.actualStartTime.toISOString(),
        op.actualEndTime.toISOString(),
        cycleTime.toFixed(2),
        standardTime,
        efficiency.toFixed(1),
        (pauseTime / 1000 / 60).toFixed(2),
        op.pauseEvents.length,
        op.quantityCompleted || 0
      ]
    }).filter(row => row.length > 0)

    return {
      title: 'Performance Metrics Export',
      headers,
      rows,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: options,
        teamId
      }
    }
  }

  /**
   * Export WIP data
   */
  static async exportWIPData(
    userId: string,
    teamId: string,
    options: ExportOptions
  ): Promise<ExportData> {
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(userId, teamId)

    // Build department filter
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    if (options.departments && options.departments.length > 0) {
      if (departmentFilter.routingOperation) {
        departmentFilter.routingOperation.departmentId = {
          in: departmentFilter.routingOperation.departmentId.in.filter((id: string) =>
            options.departments!.includes(id)
          )
        }
      } else {
        departmentFilter = {
          routingOperation: {
            departmentId: { in: options.departments }
          }
        }
      }
    }

    // Get current WIP operations
    const wipOperations = await prisma.mESWorkOrderOperation.findMany({
      where: {
        order: { teamId },
        status: { in: ['pending', 'in_progress', 'paused', 'waiting'] },
        ...departmentFilter
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            priority: true
          }
        },
        routingOperation: {
          include: {
            routing: {
              select: {
                name: true
              }
            },
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { order: { priority: 'desc' } },
        { routingOperation: { operationNumber: 'asc' } }
      ],
      cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for WIP export data
    })

    const headers = [
      'Order Number',
      'Product',
      'Priority',
      'Routing',
      'Operation Number',
      'Operation Name',
      'Department',
      'Status',
      'Operator ID',
      'Quantity To Produce',
      'Quantity Completed',
      'Created Date',
      'Updated Date'
    ]

    const rows = wipOperations.map((woo: any) => [
      woo.order.orderNumber,
      (woo.order as any).productIdentifier || '',
      woo.order.priority,
      woo.routingOperation.routing.name,
      woo.routingOperation.operationNumber,
      woo.routingOperation.operationName,
      woo.routingOperation.department?.name || 'Unassigned',
      woo.status,
      woo.operatorId || 'Unassigned',
      (woo as any).quantityToProduce || 0,
      woo.quantityCompleted || 0,
      woo.createdAt.toISOString().split('T')[0],
      woo.updatedAt.toISOString().split('T')[0]
    ])

    return {
      title: 'Work In Progress Export',
      headers,
      rows,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: options,
        teamId
      }
    }
  }

  /**
   * Convert export data to CSV format
   */
  static toCSV(data: ExportData): string {
    const csvRows = []

    // Add title
    csvRows.push(`"${data.title}"`)
    csvRows.push('') // Empty line

    // Add metadata
    csvRows.push(`"Generated at: ${data.metadata.generatedAt}"`)
    csvRows.push(`"Team ID: ${data.metadata.teamId}"`)
    csvRows.push('') // Empty line

    // Add headers
    csvRows.push(data.headers.map(header => `"${header}"`).join(','))

    // Add rows
    data.rows.forEach(row => {
      const csvRow = row.map(cell => {
        if (cell === null || cell === undefined) return '""'
        return `"${String(cell).replace(/"/g, '""')}"`
      }).join(',')
      csvRows.push(csvRow)
    })

    return csvRows.join('\n')
  }

  /**
   * Get date range based on filter option
   */
  private static getDateRange(
    dateRange?: string,
    customStartDate?: Date,
    customEndDate?: Date
  ): { startDate: Date; endDate: Date } {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (dateRange) {
      case 'today':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'yesterday':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setDate(endDate.getDate() - 1)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'last7days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last30days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break
      case 'custom':
        startDate = customStartDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = customEndDate || now
        break
      default:
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
    }

    return { startDate, endDate }
  }
}
