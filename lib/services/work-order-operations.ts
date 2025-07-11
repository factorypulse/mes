import { prisma } from '@/lib/prisma'
import type { MESWorkOrderOperation, MESPauseEvent } from '@/generated/prisma'

export interface UpdateWOOInput {
  operatorId?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled' | 'waiting'
  scheduledStartTime?: Date
  scheduledEndTime?: Date
  actualStartTime?: Date
  actualEndTime?: Date
  quantityCompleted?: number
  quantityRejected?: number
  capturedData?: any
  notes?: string
}

export interface WOOWithRelations extends MESWorkOrderOperation {
  order: {
    id: string
    orderNumber: string
    quantity: number
    priority: number
    scheduledStartDate?: Date | null
  }
  routingOperation: {
    id: string
    operationNumber: number
    operationName: string
    description?: string | null
    setupTime?: number | null
    runTime?: number | null
    instructions?: string | null
    requiredSkills?: any
    department?: {
      id: string
      name: string
    } | null
  }
  pauseEvents?: MESPauseEvent[]
}

export class WorkOrderOperationsService {
  // Get WOO by ID
  static async getWOOById(id: string, teamId: string): Promise<WOOWithRelations | null> {
    return await prisma.mESWorkOrderOperation.findFirst({
      where: {
        id,
        teamId
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      },
      cacheStrategy: { swr: 30, ttl: 30 } // 30-second cache for WOO lookups
    })
  }

  // Get WOOs by team (for operator dashboard)
  static async getWOOsByTeam(teamId: string, status?: string[], operatorId?: string): Promise<WOOWithRelations[]> {
    const whereClause: any = { teamId }

    if (status && status.length > 0) {
      whereClause.status = { in: status }
    }

    if (operatorId) {
      whereClause.operatorId = operatorId
    }

    return await prisma.mESWorkOrderOperation.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      },
      orderBy: [
        { order: { scheduledStartDate: 'asc' } },
        { routingOperation: { operationNumber: 'asc' } }
      ],
      cacheStrategy: { swr: 15, ttl: 15 } // 15-second cache for team WOO listings
    }) as any
  }

  // Get WOOs for operator dashboard (pending and paused)
  static async getOperatorWOOs(teamId: string, departmentId?: string): Promise<WOOWithRelations[]> {
    const whereClause: any = {
      teamId,
      status: { in: ['pending', 'paused'] } // Exclude 'waiting' - only show operations that are ready to work
    }

    if (departmentId) {
      whereClause.routingOperation = {
        departmentId
      }
    }

    return await prisma.mESWorkOrderOperation.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      },
      orderBy: [
        { order: { priority: 'desc' } },
        { order: { scheduledStartDate: 'asc' } },
        { routingOperation: { operationNumber: 'asc' } }
      ],
      cacheStrategy: { swr: 10, ttl: 10 } // 10-second cache for operator dashboard (needs to be responsive)
    }) as any
  }

  // Get WOOs filtered by specific departments
  static async getWOOsByDepartments(
    teamId: string,
    departmentIds: string[],
    status?: string[],
    operatorId?: string
  ): Promise<WOOWithRelations[]> {
    const whereClause: any = {
      teamId,
      routingOperation: {
        departmentId: { in: departmentIds }
      }
    }

    if (status && status.length > 0) {
      whereClause.status = { in: status }
    }

    if (operatorId) {
      whereClause.operatorId = operatorId
    }

    return await prisma.mESWorkOrderOperation.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      },
      orderBy: [
        { order: { priority: 'desc' } },
        { order: { scheduledStartDate: 'asc' } },
        { routingOperation: { operationNumber: 'asc' } }
      ],
      cacheStrategy: { swr: 20, ttl: 20 } // 20-second cache for department-filtered WOOs
    }) as any
  }

  // Start WOO
  static async startWOO(id: string, teamId: string, operatorId: string): Promise<WOOWithRelations | null> {
    const woo = await prisma.mESWorkOrderOperation.findFirst({
      where: { id, teamId, status: 'pending' }
    })

    if (!woo) {
      return null
    }

    const updatedWOO = await prisma.mESWorkOrderOperation.update({
      where: { id },
      data: {
        status: 'in_progress',
        operatorId,
        actualStartTime: new Date(),
        updatedAt: new Date()
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    })

    // Update order status
    await this.updateOrderStatus(woo.orderId, teamId)

    return updatedWOO
  }

  // Pause WOO
  static async pauseWOO(id: string, teamId: string, pauseReasonId: string, notes?: string): Promise<WOOWithRelations | null> {
    const woo = await prisma.mESWorkOrderOperation.findFirst({
      where: { id, teamId, status: 'in_progress' }
    })

    if (!woo) {
      return null
    }

    // Create pause event
    await prisma.mESPauseEvent.create({
      data: {
        workOrderOperationId: id,
        pauseReasonId,
        startTime: new Date(),
        notes,
        teamId
      }
    })

    const updatedWOO = await prisma.mESWorkOrderOperation.update({
      where: { id },
      data: {
        status: 'paused',
        updatedAt: new Date()
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    })

    // Update order status
    await this.updateOrderStatus(woo.orderId, teamId)

    return updatedWOO
  }

  // Resume WOO
  static async resumeWOO(id: string, teamId: string): Promise<WOOWithRelations | null> {
    const woo = await prisma.mESWorkOrderOperation.findFirst({
      where: { id, teamId, status: 'paused' },
      include: {
        pauseEvents: {
          where: { endTime: null },
          orderBy: { startTime: 'desc' },
          take: 1
        }
      }
    })

    if (!woo || !woo.pauseEvents.length) {
      return null
    }

    // End the current pause event
    await prisma.mESPauseEvent.update({
      where: { id: woo.pauseEvents[0].id },
      data: {
        endTime: new Date(),
        updatedAt: new Date()
      }
    })

    const updatedWOO = await prisma.mESWorkOrderOperation.update({
      where: { id },
      data: {
        status: 'in_progress',
        updatedAt: new Date()
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    })

    // Update order status
    await this.updateOrderStatus(woo.orderId, teamId)

    return updatedWOO
  }

  // Complete WOO
  static async completeWOO(id: string, teamId: string, capturedData?: any, quantityCompleted?: number, quantityRejected?: number, notes?: string): Promise<WOOWithRelations | null> {
    const woo = await prisma.mESWorkOrderOperation.findFirst({
      where: { id, teamId, status: 'in_progress' },
      include: {
        order: {
          include: {
            workOrderOperations: {
              include: {
                routingOperation: {
                  select: {
                    operationNumber: true
                  }
                }
              },
              orderBy: {
                routingOperation: {
                  operationNumber: 'asc'
                }
              }
            }
          }
        },
        routingOperation: true
      }
    })

    if (!woo) {
      return null
    }

    const now = new Date()
    let totalActiveTime = 0

    // Calculate total active time if we have start time
    if (woo.actualStartTime) {
      totalActiveTime = Math.floor((now.getTime() - woo.actualStartTime.getTime()) / 1000)

      // Subtract pause durations
      const pauseEvents = await prisma.mESPauseEvent.findMany({
        where: {
          workOrderOperationId: id,
          endTime: { not: null }
        }
      })

      for (const pause of pauseEvents) {
        if (pause.endTime) {
          const pauseDuration = Math.floor((pause.endTime.getTime() - pause.startTime.getTime()) / 1000)
          totalActiveTime -= pauseDuration
        }
      }
    }

    // Update the WOO to completed
    const completedWOO = await prisma.mESWorkOrderOperation.update({
      where: { id },
      data: {
        status: 'completed',
        actualEndTime: now,
        capturedData,
        quantityCompleted: quantityCompleted || 0,
        quantityRejected: quantityRejected || 0,
        notes,
        updatedAt: now
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    })

    // Check if this completes all WOOs for the current operation number
    const currentOperationNumber = woo.routingOperation.operationNumber
    const allWOOsForCurrentOperation = woo.order.workOrderOperations.filter(
      op => op.routingOperation?.operationNumber === currentOperationNumber
    )
    const completedWOOsForCurrentOperation = allWOOsForCurrentOperation.filter(
      op => op.status === 'completed' || op.id === id // Include the current WOO being completed
    )

    // If all WOOs for current operation are now completed, enable the next operation
    if (completedWOOsForCurrentOperation.length === allWOOsForCurrentOperation.length) {
      const nextOperationNumber = currentOperationNumber + 1
      const nextOperationWOOs = woo.order.workOrderOperations.filter(
        op => op.routingOperation?.operationNumber === nextOperationNumber
      )

      if (nextOperationWOOs.length > 0) {
        // Set all WOOs of the next operation to pending (ready to start)
        await prisma.mESWorkOrderOperation.updateMany({
          where: {
            id: { in: nextOperationWOOs.map(op => op.id) },
            status: 'waiting'
          },
          data: {
            status: 'pending',
            updatedAt: now
          }
        })
      } else {
        // This was the last operation, complete the order
        await prisma.mESOrder.update({
          where: { id: woo.orderId },
          data: {
            status: 'completed',
            actualEndDate: now,
            updatedAt: now
          }
        })
      }
    }

    // Update order status
    await this.updateOrderStatus(woo.orderId, teamId)

    return completedWOO
  }

  // Update WOO
  static async updateWOO(id: string, teamId: string, input: UpdateWOOInput): Promise<WOOWithRelations | null> {
    const woo = await prisma.mESWorkOrderOperation.findFirst({
      where: { id, teamId }
    })

    if (!woo) {
      return null
    }

    return await prisma.mESWorkOrderOperation.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date()
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    })
  }

  // Get active WOO for operator (currently in progress)
  static async getActiveWOOForOperator(operatorId: string, teamId: string): Promise<WOOWithRelations | null> {
    return await prisma.mESWorkOrderOperation.findFirst({
      where: {
        operatorId,
        teamId,
        status: 'in_progress'
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            priority: true,
            scheduledStartDate: true
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
          include: {
            pauseReason: true
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      },
      cacheStrategy: { swr: 5, ttl: 5 } // 5-second cache for active operator WOO (very responsive)
    })
  }

  // Calculate total active time for a WOO
  static async calculateActiveTime(id: string): Promise<number> {
    const woo = await prisma.mESWorkOrderOperation.findUnique({
      where: { id },
      include: {
        pauseEvents: true
      }
    })

    if (!woo || !woo.actualStartTime) {
      return 0
    }

    const endTime = woo.actualEndTime || new Date()
    let totalTime = Math.floor((endTime.getTime() - woo.actualStartTime.getTime()) / 1000)

    // Subtract pause durations
    for (const pause of woo.pauseEvents) {
      if (pause.endTime) {
        const pauseDuration = Math.floor((pause.endTime.getTime() - pause.startTime.getTime()) / 1000)
        totalTime -= pauseDuration
      } else if (woo.status === 'paused') {
        // Current pause event
        const pauseDuration = Math.floor((new Date().getTime() - pause.startTime.getTime()) / 1000)
        totalTime -= pauseDuration
      }
    }

    return Math.max(0, totalTime)
  }

  // Update order status based on work order operations
  static async updateOrderStatus(orderId: string, teamId: string): Promise<void> {
    const order = await prisma.mESOrder.findFirst({
      where: { id: orderId, teamId },
      include: {
        workOrderOperations: {
          select: {
            status: true
          }
        }
      }
    })

    if (!order || !order.workOrderOperations.length) {
      return
    }

    const wooStatuses = order.workOrderOperations.map(woo => woo.status)
    let newOrderStatus: string

    // Determine order status based on operation statuses
    if (wooStatuses.every(status => status === 'completed')) {
      // All operations completed
      newOrderStatus = 'completed'
    } else if (wooStatuses.some(status => status === 'paused')) {
      // Any operation paused
      newOrderStatus = 'paused'
    } else if (wooStatuses.some(status => status === 'in_progress')) {
      // Any operation in progress (and none paused)
      newOrderStatus = 'in_progress'
    } else if (wooStatuses.every(status => status === 'waiting')) {
      // All operations waiting (shouldn't happen but handle it)
      newOrderStatus = 'waiting'
    } else if (wooStatuses.some(status => status === 'pending')) {
      // Has pending operations
      if (wooStatuses.every(status => ['pending', 'waiting'].includes(status))) {
        // No operations started yet
        newOrderStatus = 'pending'
      } else {
        // Some operations completed, others pending/waiting
        newOrderStatus = 'waiting'
      }
    } else {
      // Default fallback
      newOrderStatus = 'pending'
    }

    // Update order status if it changed
    if (newOrderStatus !== order.status) {
      await prisma.mESOrder.update({
        where: { id: orderId },
        data: {
          status: newOrderStatus,
          ...(newOrderStatus === 'completed' && !order.actualEndDate && {
            actualEndDate: new Date()
          }),
          updatedAt: new Date()
        }
      })
    }
  }

  // Get work order operations with filters (for external API)
  static async getWorkOrderOperationsWithFilters(filters: {
    teamId: string
    status?: string[]
    operatorId?: string
    orderId?: string
    departmentId?: string
    fromDate?: Date
    toDate?: Date
    limit: number
    offset: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }): Promise<{ woos: WOOWithRelations[]; total: number }> {
    const whereClause: any = {
      teamId: filters.teamId
    }

    if (filters.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status }
    }

    if (filters.operatorId) {
      whereClause.operatorId = filters.operatorId
    }

    if (filters.orderId) {
      whereClause.orderId = filters.orderId
    }

    if (filters.departmentId) {
      whereClause.routingOperation = {
        departmentId: filters.departmentId
      }
    }

    if (filters.fromDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        gte: filters.fromDate
      }
    }

    if (filters.toDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: filters.toDate
      }
    }

    const orderBy: any = {}
    orderBy[filters.sortBy] = filters.sortOrder

    const [woos, total] = await Promise.all([
      prisma.mESWorkOrderOperation.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              quantity: true,
              priority: true,
              scheduledStartDate: true
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
            include: {
              pauseReason: true
            },
            orderBy: {
              startTime: 'desc'
            }
          }
        },
        orderBy,
        skip: filters.offset,
        take: filters.limit,
        cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for filtered WOO queries
      }),
      prisma.mESWorkOrderOperation.count({
        where: whereClause,
        cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for WOO count queries
      })
    ])

    return { woos, total }
  }

  // Migration method to fix existing WOOs to follow sequential operation logic
  static async migrateToSequentialOperations(teamId: string): Promise<void> {
    // Get all orders for the team
    const orders = await prisma.mESOrder.findMany({
      where: { teamId },
      include: {
        workOrderOperations: {
          include: {
            routingOperation: {
              select: {
                operationNumber: true
              }
            }
          },
          orderBy: {
            routingOperation: {
              operationNumber: 'asc'
            }
          }
        }
      }
    })

    for (const order of orders) {
      // Group WOOs by operation number
      const woosByOperation = new Map<number, any[]>()
      for (const woo of order.workOrderOperations) {
        const opNum = woo.routingOperation.operationNumber
        if (!woosByOperation.has(opNum)) {
          woosByOperation.set(opNum, [])
        }
        woosByOperation.get(opNum)!.push(woo)
      }

      // Find the current operation (lowest operation number with incomplete WOOs)
      let currentOperationNumber = 1
      const operationNumbers = Array.from(woosByOperation.keys()).sort((a, b) => a - b)

      for (const opNum of operationNumbers) {
        const woos = woosByOperation.get(opNum)!
        const allCompleted = woos.every(w => w.status === 'completed')

        if (!allCompleted) {
          currentOperationNumber = opNum
          break
        }

        // If all are completed, check next operation
        if (allCompleted && opNum < Math.max(...operationNumbers)) {
          continue
        }
      }

      // Update WOO statuses based on sequential logic
      for (const [opNum, woos] of woosByOperation.entries()) {
        for (const woo of woos) {
          let newStatus = woo.status

          if (woo.status === 'completed' || woo.status === 'in_progress') {
            // Keep completed and in-progress as is
            continue
          } else if (opNum === currentOperationNumber) {
            // Current operation should be pending
            newStatus = 'pending'
          } else if (opNum > currentOperationNumber) {
            // Future operations should be waiting
            newStatus = 'waiting'
          }

          if (newStatus !== woo.status) {
            await prisma.mESWorkOrderOperation.update({
              where: { id: woo.id },
              data: { status: newStatus }
            })
          }
        }
      }
    }
  }
}
