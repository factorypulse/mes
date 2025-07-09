import { OrdersService } from '@/lib/services/orders'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    mESOrder: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    mESWorkOrderOperation: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

describe('OrdersService', () => {
  const mockTeamId = 'team-123'
  const mockOrderId = 'order-456'
  const mockRoutingId = 'routing-789'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createOrder', () => {
    it('should create order and generate work order operations', async () => {
      const mockRouting = {
        id: mockRoutingId,
        operations: [
          {
            id: 'op-1',
            operationNumber: 1,
            operationName: 'Assembly',
            department: { id: 'dept-1', name: 'Assembly Dept' },
          },
          {
            id: 'op-2',
            operationNumber: 2,
            operationName: 'Testing',
            department: { id: 'dept-2', name: 'QC Dept' },
          },
        ],
      }

      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        productIdentifier: 'WIDGET-001',
        quantity: 100,
        teamId: mockTeamId,
        routingId: mockRoutingId,
        status: 'planned',
        routing: mockRouting,
        workOrderOperations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockOrderWithWOOs = {
        ...mockOrder,
        workOrderOperations: [
          {
            id: 'woo-1',
            orderId: mockOrderId,
            routingOperationId: 'op-1',
            status: 'pending',
            routingOperation: mockRouting.operations[0],
          },
          {
            id: 'woo-2',
            orderId: mockOrderId,
            routingOperationId: 'op-2',
            status: 'pending',
            routingOperation: mockRouting.operations[1],
          },
        ],
      }

      ;(prisma.mESOrder.create as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.mESWorkOrderOperation.createMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(OrdersService.getOrderById as jest.Mock) = jest.fn().mockResolvedValue(mockOrderWithWOOs)

      const input = {
        orderNumber: 'ORD-001',
        productIdentifier: 'WIDGET-001',
        quantity: 100,
        teamId: mockTeamId,
        routingId: mockRoutingId,
      }

      const result = await OrdersService.createOrder(input)

      expect(prisma.mESOrder.create).toHaveBeenCalledWith({
        data: input,
        include: {
          routing: {
            include: {
              operations: {
                include: { department: true },
                orderBy: { operationNumber: 'asc' },
              },
            },
          },
          workOrderOperations: {
            include: {
              routingOperation: {
                include: { department: true },
              },
            },
          },
        },
      })

      expect(prisma.mESWorkOrderOperation.createMany).toHaveBeenCalledWith({
        data: [
          {
            orderId: mockOrderId,
            routingOperationId: 'op-1',
            teamId: mockTeamId,
            status: 'pending',
          },
          {
            orderId: mockOrderId,
            routingOperationId: 'op-2',
            teamId: mockTeamId,
            status: 'pending',
          },
        ],
      })
    })

    it('should create order without WOOs when routing has no operations', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-002',
        teamId: mockTeamId,
        routing: { operations: [] },
        workOrderOperations: [],
      }

      ;(prisma.mESOrder.create as jest.Mock).mockResolvedValue(mockOrder)
      ;(OrdersService.getOrderById as jest.Mock) = jest.fn().mockResolvedValue(mockOrder)

      const input = {
        orderNumber: 'ORD-002',
        productIdentifier: 'WIDGET-002',
        quantity: 50,
        teamId: mockTeamId,
        routingId: mockRoutingId,
      }

      const result = await OrdersService.createOrder(input)

      expect(prisma.mESWorkOrderOperation.createMany).not.toHaveBeenCalled()
    })
  })

  describe('getOrderById', () => {
    it('should return order with full details when found', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        teamId: mockTeamId,
        routing: {
          id: mockRoutingId,
          name: 'Standard Assembly',
          operations: [],
        },
        workOrderOperations: [],
      }

      ;(prisma.mESOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder)

      const result = await OrdersService.getOrderById(mockOrderId, mockTeamId)

      expect(prisma.mESOrder.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockOrderId,
          teamId: mockTeamId,
        },
        include: {
          routing: {
            include: {
              operations: {
                include: { department: true },
                orderBy: { operationNumber: 'asc' },
              },
            },
          },
          workOrderOperations: {
            include: {
              routingOperation: {
                include: { department: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      expect(result).toEqual(mockOrder)
    })

    it('should return null when order not found', async () => {
      ;(prisma.mESOrder.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await OrdersService.getOrderById('nonexistent', mockTeamId)

      expect(result).toBeNull()
    })
  })

  describe('getOrdersByTeam', () => {
    it('should return all orders when no status filter', async () => {
      const mockOrders = [
        { id: 'order-1', status: 'planned', teamId: mockTeamId },
        { id: 'order-2', status: 'in_progress', teamId: mockTeamId },
        { id: 'order-3', status: 'completed', teamId: mockTeamId },
      ]

      ;(prisma.mESOrder.findMany as jest.Mock).mockResolvedValue(mockOrders)

      const result = await OrdersService.getOrdersByTeam(mockTeamId)

      expect(prisma.mESOrder.findMany).toHaveBeenCalledWith({
        where: { teamId: mockTeamId },
        include: {
          routing: {
            include: {
              operations: {
                include: { department: true },
                orderBy: { operationNumber: 'asc' },
              },
            },
          },
          workOrderOperations: {
            include: {
              routingOperation: {
                include: { department: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toEqual(mockOrders)
    })

    it('should filter orders by status when provided', async () => {
      const mockOrders = [
        { id: 'order-1', status: 'in_progress', teamId: mockTeamId },
      ]

      ;(prisma.mESOrder.findMany as jest.Mock).mockResolvedValue(mockOrders)

      const result = await OrdersService.getOrdersByTeam(mockTeamId, 'in_progress')

      expect(prisma.mESOrder.findMany).toHaveBeenCalledWith({
        where: {
          teamId: mockTeamId,
          status: 'in_progress',
        },
        include: {
          routing: {
            include: {
              operations: {
                include: { department: true },
                orderBy: { operationNumber: 'asc' },
              },
            },
          },
          workOrderOperations: {
            include: {
              routingOperation: {
                include: { department: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toEqual(mockOrders)
    })
  })

  describe('updateOrder', () => {
    it('should update order with date conversion', async () => {
      const mockExistingOrder = { id: mockOrderId, teamId: mockTeamId }
      const mockUpdatedOrder = {
        id: mockOrderId,
        quantity: 150,
        scheduledStartDate: new Date('2025-01-01'),
        teamId: mockTeamId,
      }

      ;(prisma.mESOrder.findFirst as jest.Mock).mockResolvedValue(mockExistingOrder)
      ;(prisma.mESOrder.update as jest.Mock).mockResolvedValue(mockUpdatedOrder)

      const updateData = {
        quantity: 150,
        scheduledStartDate: '2025-01-01T00:00:00.000Z',
      }

      const result = await OrdersService.updateOrder(mockOrderId, mockTeamId, updateData)

      expect(prisma.mESOrder.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: {
          quantity: 150,
          scheduledStartDate: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: expect.any(Date),
        },
        include: {
          routing: {
            include: {
              operations: {
                include: { department: true },
                orderBy: { operationNumber: 'asc' },
              },
            },
          },
          workOrderOperations: {
            include: {
              routingOperation: {
                include: { department: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      expect(result).toEqual(mockUpdatedOrder)
    })

    it('should return null when order not found', async () => {
      ;(prisma.mESOrder.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await OrdersService.updateOrder('nonexistent', mockTeamId, { quantity: 200 })

      expect(result).toBeNull()
      expect(prisma.mESOrder.update).not.toHaveBeenCalled()
    })
  })

  describe('startOrder', () => {
    it('should start order and update status', async () => {
      const mockExistingOrder = { id: mockOrderId, teamId: mockTeamId, status: 'planned' }
      const mockStartedOrder = {
        ...mockExistingOrder,
        status: 'in_progress',
        actualStartDate: expect.any(Date),
      }

      ;(prisma.mESOrder.findFirst as jest.Mock).mockResolvedValue(mockExistingOrder)
      ;(prisma.mESOrder.update as jest.Mock).mockResolvedValue(mockStartedOrder)

      const result = await OrdersService.startOrder(mockOrderId, mockTeamId)

      expect(prisma.mESOrder.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: {
          status: 'in_progress',
          actualStartDate: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        include: {
          routing: {
            include: {
              operations: {
                include: { department: true },
                orderBy: { operationNumber: 'asc' },
              },
            },
          },
          workOrderOperations: {
            include: {
              routingOperation: {
                include: { department: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      expect(result).toEqual(mockStartedOrder)
    })
  })

  describe('completeOrder', () => {
    it('should complete order and update all WOOs', async () => {
      const mockExistingOrder = {
        id: mockOrderId,
        teamId: mockTeamId,
        status: 'in_progress',
        workOrderOperations: [
          { id: 'woo-1', status: 'in_progress' },
          { id: 'woo-2', status: 'pending' },
        ],
      }

      const mockCompletedOrder = {
        ...mockExistingOrder,
        status: 'completed',
        actualEndDate: expect.any(Date),
      }

      ;(prisma.mESOrder.findFirst as jest.Mock).mockResolvedValue(mockExistingOrder)
      ;(prisma.mESOrder.update as jest.Mock).mockResolvedValue(mockCompletedOrder)
      ;(prisma.mESWorkOrderOperation.updateMany as jest.Mock).mockResolvedValue({ count: 2 })

      const result = await OrdersService.completeOrder(mockOrderId, mockTeamId)

      expect(prisma.mESWorkOrderOperation.updateMany).toHaveBeenCalledWith({
        where: { orderId: mockOrderId },
        data: { status: 'completed' },
      })

      expect(prisma.mESOrder.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: {
          status: 'completed',
          actualEndDate: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        include: {
          routing: {
            include: {
              operations: {
                include: { department: true },
                orderBy: { operationNumber: 'asc' },
              },
            },
          },
          workOrderOperations: {
            include: {
              routingOperation: {
                include: { department: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      expect(result).toEqual(mockCompletedOrder)
    })
  })

  describe('deleteOrder', () => {
    it('should soft delete order by setting status to cancelled', async () => {
      const mockExistingOrder = { id: mockOrderId, teamId: mockTeamId }

      ;(prisma.mESOrder.findFirst as jest.Mock).mockResolvedValue(mockExistingOrder)
      ;(prisma.mESOrder.update as jest.Mock).mockResolvedValue(mockExistingOrder)

      const result = await OrdersService.deleteOrder(mockOrderId, mockTeamId)

      expect(prisma.mESOrder.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: {
          status: 'cancelled',
          updatedAt: expect.any(Date),
        },
      })

      expect(result).toBe(true)
    })

    it('should return false when order not found', async () => {
      ;(prisma.mESOrder.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await OrdersService.deleteOrder('nonexistent', mockTeamId)

      expect(result).toBe(false)
      expect(prisma.mESOrder.update).not.toHaveBeenCalled()
    })
  })
})
