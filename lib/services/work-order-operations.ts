import { prisma } from '@/lib/prisma'
import type { MESWorkOrderOperation, MESPauseEvent } from '@/generated/prisma'

export interface UpdateWOOInput {
  operatorId?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled'
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
      }
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
      ]
    })
  }

  // Get WOOs for operator dashboard (pending and paused)
  static async getOperatorWOOs(teamId: string, departmentId?: string): Promise<WOOWithRelations[]> {
    const whereClause: any = {
      teamId,
      status: { in: ['pending', 'paused'] }
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
      ]
    })
  }

  // Start WOO
  static async startWOO(id: string, teamId: string, operatorId: string): Promise<WOOWithRelations | null> {
    const woo = await prisma.mESWorkOrderOperation.findFirst({
      where: { id, teamId, status: 'pending' }
    })

    if (!woo) {
      return null
    }

    return await prisma.mESWorkOrderOperation.update({
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

    return await prisma.mESWorkOrderOperation.update({
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

    return await prisma.mESWorkOrderOperation.update({
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
  }

  // Complete WOO
  static async completeWOO(id: string, teamId: string, capturedData?: any, quantityCompleted?: number, quantityRejected?: number, notes?: string): Promise<WOOWithRelations | null> {
    const woo = await prisma.mESWorkOrderOperation.findFirst({
      where: { id, teamId, status: 'in_progress' },
      include: {
        order: {
          include: {
            workOrderOperations: {
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

    // Check if this is the last WOO for the order
    const currentWOOIndex = woo.order.workOrderOperations.findIndex(op => op.id === id)
    const nextWOO = woo.order.workOrderOperations[currentWOOIndex + 1]

    if (nextWOO) {
      // Set next WOO to pending (ready to start)
      await prisma.mESWorkOrderOperation.update({
        where: { id: nextWOO.id },
        data: {
          status: 'pending',
          updatedAt: now
        }
      })
    } else {
      // This was the last WOO, complete the order
      await prisma.mESOrder.update({
        where: { id: woo.orderId },
        data: {
          status: 'completed',
          actualEndDate: now,
          updatedAt: now
        }
      })
    }

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
      }
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
}
