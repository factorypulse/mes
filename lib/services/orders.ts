import { prisma } from '@/lib/prisma'
import { MESOrder, MESWorkOrderOperation } from '@/generated/prisma'

export interface CreateOrderInput {
  orderNumber: string
  routingId: string
  quantity: number
  priority?: number
  scheduledStartDate?: Date
  scheduledEndDate?: Date
  notes?: string
  customFields?: any
  teamId: string
}

export interface UpdateOrderInput {
  orderNumber?: string
  routingId?: string
  quantity?: number
  priority?: number
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  scheduledStartDate?: Date
  scheduledEndDate?: Date
  actualStartDate?: Date
  actualEndDate?: Date
  notes?: string
  customFields?: any
}

export class OrdersService {
  // Create a new order
  static async createOrder(input: CreateOrderInput): Promise<MESOrder> {
    const order = await prisma.mESOrder.create({
      data: input,
      include: {
        routing: {
          include: {
            operations: {
              include: {
                department: true
              },
              orderBy: {
                operationNumber: 'asc'
              }
            }
          }
        },
        workOrderOperations: {
          include: {
            routingOperation: {
              include: {
                department: true
              }
            }
          }
        }
      }
    })

    // Create work order operations for each routing operation
    if (order.routing.operations.length > 0) {
      const workOrderOperations = order.routing.operations.map(routingOp => ({
        orderId: order.id,
        routingOperationId: routingOp.id,
        teamId: input.teamId,
        // Only set operation 1 to 'pending', others should wait until previous operations are completed
        status: routingOp.operationNumber === 1 ? 'pending' : 'waiting'
      }))

      await prisma.mESWorkOrderOperation.createMany({
        data: workOrderOperations
      })
    }

    // Return the order with updated work order operations
    return await this.getOrderById(order.id, input.teamId) as MESOrder
  }

  // Get order by ID
  static async getOrderById(id: string, teamId: string): Promise<MESOrder | null> {
    return await prisma.mESOrder.findFirst({
      where: {
        id,
        teamId
      },
      include: {
        routing: {
          include: {
            operations: {
              include: {
                department: true
              },
              orderBy: {
                operationNumber: 'asc'
              }
            }
          }
        },
        workOrderOperations: {
          include: {
            routingOperation: {
              include: {
                department: true
              }
            }
          }
        }
      },
      cacheStrategy: { swr: 30, ttl: 30 } // 30-second cache for order lookups
    })
  }

  // Get all orders for a team
  static async getOrdersByTeam(teamId: string, status?: string): Promise<MESOrder[]> {
    return await prisma.mESOrder.findMany({
      where: {
        teamId,
        ...(status ? { status } : {})
      },
      include: {
        routing: {
          include: {
            operations: {
              include: {
                department: true
              },
              orderBy: {
                operationNumber: 'asc'
              }
            }
          }
        },
        workOrderOperations: {
          include: {
            routingOperation: {
              include: {
                department: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      cacheStrategy: { swr: 15, ttl: 15 } // 15-second cache for team order listings
    })
  }

  // Update order
  static async updateOrder(id: string, teamId: string, input: UpdateOrderInput): Promise<MESOrder | null> {
    const order = await prisma.mESOrder.findFirst({
      where: { id, teamId }
    })

    if (!order) {
      return null
    }

    return await prisma.mESOrder.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date()
      },
      include: {
        routing: {
          include: {
            operations: {
              include: {
                department: true
              },
              orderBy: {
                operationNumber: 'asc'
              }
            }
          }
        },
        workOrderOperations: {
          include: {
            routingOperation: {
              include: {
                department: true
              }
            }
          }
        }
      }
    })
  }

  // Delete order (soft delete by setting status to cancelled)
  static async deleteOrder(id: string, teamId: string): Promise<boolean> {
    const order = await prisma.mESOrder.findFirst({
      where: { id, teamId }
    })

    if (!order) {
      return false
    }

    await prisma.mESOrder.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    })

    return true
  }

  // Start order (sets status to in_progress and actualStartDate)
  static async startOrder(id: string, teamId: string): Promise<MESOrder | null> {
    const order = await prisma.mESOrder.findFirst({
      where: { id, teamId, status: 'pending' }
    })

    if (!order) {
      return null
    }

    return await prisma.mESOrder.update({
      where: { id },
      data: {
        status: 'in_progress',
        actualStartDate: new Date(),
        updatedAt: new Date()
      },
      include: {
        routing: {
          include: {
            operations: {
              include: {
                department: true
              },
              orderBy: {
                operationNumber: 'asc'
              }
            }
          }
        },
        workOrderOperations: {
          include: {
            routingOperation: {
              include: {
                department: true
              }
            }
          }
        }
      }
    })
  }

  // Complete order (sets status to completed and actualEndDate)
  static async completeOrder(id: string, teamId: string): Promise<MESOrder | null> {
    const order = await prisma.mESOrder.findFirst({
      where: { id, teamId, status: 'in_progress' }
    })

    if (!order) {
      return null
    }

    return await prisma.mESOrder.update({
      where: { id },
      data: {
        status: 'completed',
        actualEndDate: new Date(),
        updatedAt: new Date()
      },
      include: {
        routing: {
          include: {
            operations: {
              include: {
                department: true
              },
              orderBy: {
                operationNumber: 'asc'
              }
            }
          }
        },
        workOrderOperations: {
          include: {
            routingOperation: {
              include: {
                department: true
              }
            }
          }
        }
      }
    })
  }

  // Get order progress/completion percentage
  static async getOrderProgress(id: string, teamId: string): Promise<number> {
    const order = await prisma.mESOrder.findFirst({
      where: { id, teamId },
      include: {
        workOrderOperations: true
      }
    })

    if (!order || !order.workOrderOperations.length) {
      return 0
    }

    const completedOps = order.workOrderOperations.filter(op => op.status === 'completed').length
    return Math.round((completedOps / order.workOrderOperations.length) * 100)
  }

  // Get orders with filters (for external API)
  static async getOrdersWithFilters(filters: {
    teamId: string
    status?: string
    fromDate?: Date
    toDate?: Date
    erpReference?: string
    productIdentifier?: string
    limit: number
    offset: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }): Promise<{ orders: MESOrder[]; total: number }> {
    const whereClause: any = {
      teamId: filters.teamId
    }

    if (filters.status) {
      whereClause.status = filters.status
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

    const [orders, total] = await Promise.all([
      prisma.mESOrder.findMany({
        where: whereClause,
        include: {
          routing: {
            include: {
              operations: {
                include: {
                  department: true
                },
                orderBy: {
                  operationNumber: 'asc'
                }
              }
            }
          },
          workOrderOperations: {
            include: {
              routingOperation: {
                include: {
                  department: true
                }
              }
            },
            orderBy: {
              id: 'asc'
            }
          }
        },
        orderBy,
        skip: filters.offset,
        take: filters.limit,
        cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for filtered queries (often used by external APIs)
      }),
      prisma.mESOrder.count({
        where: whereClause,
        cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for count queries
      })
    ])

    return { orders, total }
  }
}
