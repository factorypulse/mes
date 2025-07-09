import { RoutingsService } from '@/lib/services/routings'
import { OrdersService } from '@/lib/services/orders'
import { WorkOrderOperationsService } from '@/lib/services/work-order-operations'
import { PauseReasonsService } from '@/lib/services/pause-reasons'

// Mock Prisma at the module level
jest.mock('@/lib/prisma', () => ({
  prisma: {
    mESRouting: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    mESRoutingOperation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    mESOrder: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    mESWorkOrderOperation: {
      createMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    mESPauseReason: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    mESPauseRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('MES Workflow Integration Tests', () => {
  const mockTeamId = 'team-integration-test'
  const mockUserId = 'user-operator'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Order Lifecycle', () => {
    it('should handle full order lifecycle from creation to completion', async () => {
      // Step 1: Create a routing with operations
      const mockRouting = {
        id: 'routing-lifecycle-1',
        name: 'Standard Assembly Process',
        description: 'Complete assembly and testing',
        teamId: mockTeamId,
        isActive: true,
        operations: [
          {
            id: 'op-1',
            operationNumber: 1,
            operationName: 'Assembly',
            runTime: 1800,
            setupTime: 300,
            routingId: 'routing-lifecycle-1',
            teamId: mockTeamId,
            department: { id: 'dept-assembly', name: 'Assembly Department' },
          },
          {
            id: 'op-2',
            operationNumber: 2,
            operationName: 'Quality Testing',
            runTime: 600,
            setupTime: 120,
            routingId: 'routing-lifecycle-1',
            teamId: mockTeamId,
            department: { id: 'dept-qc', name: 'Quality Control' },
          },
        ],
      }

      const { prisma } = require('@/lib/prisma')
      prisma.mESRouting.create.mockResolvedValue(mockRouting)
      prisma.mESRouting.findFirst.mockResolvedValue(mockRouting)

      const routing = await RoutingsService.createRouting({
        name: 'Standard Assembly Process',
        description: 'Complete assembly and testing',
        teamId: mockTeamId,
        operations: [
          {
            operationNumber: 1,
            operationName: 'Assembly',
            runTime: 1800,
            setupTime: 300,
          },
          {
            operationNumber: 2,
            operationName: 'Quality Testing',
            runTime: 600,
            setupTime: 120,
          },
        ],
      })

      expect(routing).toEqual(mockRouting)

      // Step 2: Create an order using the routing
      const mockOrder = {
        id: 'order-lifecycle-1',
        orderNumber: 'ORD-LIFECYCLE-001',
        productIdentifier: 'WIDGET-LIFECYCLE-001',
        quantity: 100,
        status: 'planned',
        teamId: mockTeamId,
        routingId: mockRouting.id,
        routing: mockRouting,
        workOrderOperations: [
          {
            id: 'woo-1',
            orderId: 'order-lifecycle-1',
            routingOperationId: 'op-1',
            status: 'pending',
            teamId: mockTeamId,
            routingOperation: mockRouting.operations[0],
          },
          {
            id: 'woo-2',
            orderId: 'order-lifecycle-1',
            routingOperationId: 'op-2',
            status: 'pending',
            teamId: mockTeamId,
            routingOperation: mockRouting.operations[1],
          },
        ],
      }

      prisma.mESOrder.create.mockResolvedValue({
        ...mockOrder,
        workOrderOperations: [],
      })
      prisma.mESWorkOrderOperation.createMany.mockResolvedValue({ count: 2 })

      // Mock the getOrderById call that happens after creation
      jest.spyOn(OrdersService, 'getOrderById').mockResolvedValue(mockOrder)

      const order = await OrdersService.createOrder({
        orderNumber: 'ORD-LIFECYCLE-001',
        productIdentifier: 'WIDGET-LIFECYCLE-001',
        quantity: 100,
        teamId: mockTeamId,
        routingId: mockRouting.id,
      })

      expect(order).toEqual(mockOrder)
      expect(order.workOrderOperations).toHaveLength(2)

      // Step 3: Start the order
      const mockStartedOrder = {
        ...mockOrder,
        status: 'in_progress',
        actualStartDate: new Date(),
      }

      prisma.mESOrder.findFirst.mockResolvedValue(mockOrder)
      prisma.mESOrder.update.mockResolvedValue(mockStartedOrder)

      const startedOrder = await OrdersService.startOrder(order.id, mockTeamId)

      expect(startedOrder.status).toBe('in_progress')
      expect(startedOrder.actualStartDate).toBeDefined()

      // Step 4: Start first Work Order Operation (Assembly)
      const mockStartedWOO1 = {
        ...mockOrder.workOrderOperations[0],
        status: 'in_progress',
        actualStartTime: new Date(),
        currentOperatorId: mockUserId,
      }

      prisma.mESWorkOrderOperation.findFirst.mockResolvedValue(mockOrder.workOrderOperations[0])
      prisma.mESWorkOrderOperation.update.mockResolvedValue(mockStartedWOO1)

      const startedWOO1 = await WorkOrderOperationsService.startWOO('woo-1', mockTeamId, mockUserId)

      expect(startedWOO1.status).toBe('in_progress')
      expect(startedWOO1.actualStartTime).toBeDefined()
      expect(startedWOO1.currentOperatorId).toBe(mockUserId)

      // Step 5: Complete first Work Order Operation
      const mockCompletedWOO1 = {
        ...mockStartedWOO1,
        status: 'completed',
        actualEndTime: new Date(),
        quantityCompleted: 100,
        capturedData: { temperature: '25°C', pressure: '120 PSI' },
      }

      prisma.mESWorkOrderOperation.update.mockResolvedValue(mockCompletedWOO1)

      const completedWOO1 = await WorkOrderOperationsService.completeWOO(
        'woo-1',
        mockTeamId,
        { temperature: '25°C', pressure: '120 PSI' },
        100,
        0,
        'Assembly completed successfully'
      )

      expect(completedWOO1.status).toBe('completed')
      expect(completedWOO1.quantityCompleted).toBe(100)
      expect(completedWOO1.capturedData).toEqual({ temperature: '25°C', pressure: '120 PSI' })

      // Step 6: Start second Work Order Operation (Quality Testing)
      const mockStartedWOO2 = {
        ...mockOrder.workOrderOperations[1],
        status: 'in_progress',
        actualStartTime: new Date(),
        currentOperatorId: mockUserId,
      }

      prisma.mESWorkOrderOperation.findFirst.mockResolvedValue(mockOrder.workOrderOperations[1])
      prisma.mESWorkOrderOperation.update.mockResolvedValue(mockStartedWOO2)

      const startedWOO2 = await WorkOrderOperationsService.startWOO('woo-2', mockTeamId, mockUserId)

      expect(startedWOO2.status).toBe('in_progress')

      // Step 7: Complete second Work Order Operation
      const mockCompletedWOO2 = {
        ...mockStartedWOO2,
        status: 'completed',
        actualEndTime: new Date(),
        quantityCompleted: 100,
        capturedData: { testResults: 'PASS', defects: 0 },
      }

      prisma.mESWorkOrderOperation.update.mockResolvedValue(mockCompletedWOO2)

      const completedWOO2 = await WorkOrderOperationsService.completeWOO(
        'woo-2',
        mockTeamId,
        { testResults: 'PASS', defects: 0 },
        100,
        0,
        'Quality testing passed'
      )

      expect(completedWOO2.status).toBe('completed')
      expect(completedWOO2.capturedData).toEqual({ testResults: 'PASS', defects: 0 })

      // Step 8: Complete the entire order
      const mockCompletedOrder = {
        ...mockStartedOrder,
        status: 'completed',
        actualEndDate: new Date(),
        workOrderOperations: [mockCompletedWOO1, mockCompletedWOO2],
      }

      prisma.mESOrder.findFirst.mockResolvedValue({
        ...mockStartedOrder,
        workOrderOperations: [mockCompletedWOO1, mockCompletedWOO2],
      })
      prisma.mESWorkOrderOperation.updateMany.mockResolvedValue({ count: 2 })
      prisma.mESOrder.update.mockResolvedValue(mockCompletedOrder)

      const completedOrder = await OrdersService.completeOrder(order.id, mockTeamId)

      expect(completedOrder.status).toBe('completed')
      expect(completedOrder.actualEndDate).toBeDefined()

      // Verify all operations are completed
      expect(completedOrder.workOrderOperations.every(woo => woo.status === 'completed')).toBe(true)
    })
  })

  describe('Work Order Operation Pause/Resume Workflow', () => {
    it('should handle pause and resume operations with pause reasons', async () => {
      // Step 1: Create pause reason
      const mockPauseReason = {
        id: 'pause-reason-maintenance',
        name: 'Machine Maintenance',
        description: 'Scheduled maintenance required',
        category: 'maintenance',
        teamId: mockTeamId,
        isActive: true,
      }

      const { prisma } = require('@/lib/prisma')
      prisma.mESPauseReason.create.mockResolvedValue(mockPauseReason)

      const pauseReason = await PauseReasonsService.createPauseReason({
        name: 'Machine Maintenance',
        description: 'Scheduled maintenance required',
        category: 'maintenance',
        teamId: mockTeamId,
      })

      expect(pauseReason).toEqual(mockPauseReason)

      // Step 2: Start a Work Order Operation
      const mockWOO = {
        id: 'woo-pause-test',
        orderId: 'order-pause-test',
        status: 'pending',
        teamId: mockTeamId,
        routingOperation: {
          id: 'op-pause-test',
          operationName: 'Assembly with Maintenance',
        },
      }

      const mockStartedWOO = {
        ...mockWOO,
        status: 'in_progress',
        actualStartTime: new Date(),
        currentOperatorId: mockUserId,
      }

      prisma.mESWorkOrderOperation.findFirst.mockResolvedValue(mockWOO)
      prisma.mESWorkOrderOperation.update.mockResolvedValue(mockStartedWOO)

      const startedWOO = await WorkOrderOperationsService.startWOO('woo-pause-test', mockTeamId, mockUserId)

      expect(startedWOO.status).toBe('in_progress')

      // Step 3: Pause the Work Order Operation
      const mockPausedWOO = {
        ...mockStartedWOO,
        status: 'paused',
        pauseReason: mockPauseReason,
      }

      const mockPauseRecord = {
        id: 'pause-record-1',
        workOrderOperationId: 'woo-pause-test',
        pauseReasonId: mockPauseReason.id,
        startTime: new Date(),
        notes: 'Maintenance required for conveyor belt',
      }

      prisma.mESWorkOrderOperation.findFirst.mockResolvedValue(mockStartedWOO)
      prisma.mESWorkOrderOperation.update.mockResolvedValue(mockPausedWOO)
      prisma.mESPauseRecord.create.mockResolvedValue(mockPauseRecord)

      const pausedWOO = await WorkOrderOperationsService.pauseWOO(
        'woo-pause-test',
        mockTeamId,
        mockPauseReason.id,
        'Maintenance required for conveyor belt'
      )

      expect(pausedWOO.status).toBe('paused')

      // Step 4: Resume the Work Order Operation
      const mockResumedWOO = {
        ...mockPausedWOO,
        status: 'in_progress',
        pauseReason: null,
      }

      prisma.mESWorkOrderOperation.findFirst.mockResolvedValue(mockPausedWOO)
      prisma.mESWorkOrderOperation.update.mockResolvedValue(mockResumedWOO)

      const resumedWOO = await WorkOrderOperationsService.resumeWOO('woo-pause-test', mockTeamId)

      expect(resumedWOO.status).toBe('in_progress')

      // Step 5: Complete the Work Order Operation
      const mockCompletedWOO = {
        ...mockResumedWOO,
        status: 'completed',
        actualEndTime: new Date(),
        quantityCompleted: 50,
      }

      prisma.mESWorkOrderOperation.update.mockResolvedValue(mockCompletedWOO)

      const completedWOO = await WorkOrderOperationsService.completeWOO(
        'woo-pause-test',
        mockTeamId,
        { finalInspection: 'PASS' },
        50,
        0,
        'Completed after maintenance'
      )

      expect(completedWOO.status).toBe('completed')
      expect(completedWOO.quantityCompleted).toBe(50)
    })
  })

  describe('Multi-Department Workflow', () => {
    it('should handle operations across multiple departments', async () => {
      // Create routing with operations in different departments
      const mockRouting = {
        id: 'routing-multi-dept',
        name: 'Multi-Department Process',
        operations: [
          {
            id: 'op-machining',
            operationNumber: 1,
            operationName: 'Machining',
            department: { id: 'dept-machining', name: 'Machining' },
          },
          {
            id: 'op-assembly',
            operationNumber: 2,
            operationName: 'Assembly',
            department: { id: 'dept-assembly', name: 'Assembly' },
          },
          {
            id: 'op-testing',
            operationNumber: 3,
            operationName: 'Final Testing',
            department: { id: 'dept-qc', name: 'Quality Control' },
          },
        ],
      }

      const mockOrder = {
        id: 'order-multi-dept',
        orderNumber: 'ORD-MULTI-001',
        quantity: 25,
        routing: mockRouting,
        workOrderOperations: [
          {
            id: 'woo-machining',
            routingOperation: mockRouting.operations[0],
            status: 'pending',
          },
          {
            id: 'woo-assembly',
            routingOperation: mockRouting.operations[1],
            status: 'pending',
          },
          {
            id: 'woo-testing',
            routingOperation: mockRouting.operations[2],
            status: 'pending',
          },
        ],
      }

      const { prisma } = require('@/lib/prisma')

      // Simulate operator workflow across departments
      const operators = {
        machining: 'operator-machining',
        assembly: 'operator-assembly',
        testing: 'operator-testing',
      }

      // Step 1: Machining Department
      prisma.mESWorkOrderOperation.findFirst.mockResolvedValue(mockOrder.workOrderOperations[0])
      prisma.mESWorkOrderOperation.update.mockResolvedValue({
        ...mockOrder.workOrderOperations[0],
        status: 'in_progress',
        currentOperatorId: operators.machining,
      })

      const startedMachining = await WorkOrderOperationsService.startWOO(
        'woo-machining',
        mockTeamId,
        operators.machining
      )

      expect(startedMachining.currentOperatorId).toBe(operators.machining)

      // Complete machining
      prisma.mESWorkOrderOperation.update.mockResolvedValue({
        ...startedMachining,
        status: 'completed',
        quantityCompleted: 25,
        capturedData: { dimensions: 'within tolerance', surfaceFinish: 'acceptable' },
      })

      const completedMachining = await WorkOrderOperationsService.completeWOO(
        'woo-machining',
        mockTeamId,
        { dimensions: 'within tolerance', surfaceFinish: 'acceptable' },
        25,
        0
      )

      expect(completedMachining.status).toBe('completed')

      // Step 2: Assembly Department
      prisma.mESWorkOrderOperation.findFirst.mockResolvedValue(mockOrder.workOrderOperations[1])
      prisma.mESWorkOrderOperation.update.mockResolvedValue({
        ...mockOrder.workOrderOperations[1],
        status: 'in_progress',
        currentOperatorId: operators.assembly,
      })

      const startedAssembly = await WorkOrderOperationsService.startWOO(
        'woo-assembly',
        mockTeamId,
        operators.assembly
      )

      expect(startedAssembly.currentOperatorId).toBe(operators.assembly)

      // Complete assembly
      prisma.mESWorkOrderOperation.update.mockResolvedValue({
        ...startedAssembly,
        status: 'completed',
        quantityCompleted: 25,
        capturedData: { torqueSettings: '50 Nm', boltsTightened: 12 },
      })

      const completedAssembly = await WorkOrderOperationsService.completeWOO(
        'woo-assembly',
        mockTeamId,
        { torqueSettings: '50 Nm', boltsTightened: 12 },
        25,
        0
      )

      expect(completedAssembly.status).toBe('completed')

      // Step 3: Testing Department
      prisma.mESWorkOrderOperation.findFirst.mockResolvedValue(mockOrder.workOrderOperations[2])
      prisma.mESWorkOrderOperation.update.mockResolvedValue({
        ...mockOrder.workOrderOperations[2],
        status: 'in_progress',
        currentOperatorId: operators.testing,
      })

      const startedTesting = await WorkOrderOperationsService.startWOO(
        'woo-testing',
        mockTeamId,
        operators.testing
      )

      expect(startedTesting.currentOperatorId).toBe(operators.testing)

      // Complete testing
      prisma.mESWorkOrderOperation.update.mockResolvedValue({
        ...startedTesting,
        status: 'completed',
        quantityCompleted: 24, // 1 rejected during testing
        capturedData: {
          functionalTest: 'PASS',
          safetyTest: 'PASS',
          defectiveUnits: 1,
          defectType: 'cosmetic damage'
        },
      })

      const completedTesting = await WorkOrderOperationsService.completeWOO(
        'woo-testing',
        mockTeamId,
        {
          functionalTest: 'PASS',
          safetyTest: 'PASS',
          defectiveUnits: 1,
          defectType: 'cosmetic damage'
        },
        24,
        1,
        '1 unit rejected for cosmetic damage'
      )

      expect(completedTesting.status).toBe('completed')
      expect(completedTesting.quantityCompleted).toBe(24)

      // Verify workflow progression
      expect(completedMachining.routingOperation.operationNumber).toBe(1)
      expect(completedAssembly.routingOperation.operationNumber).toBe(2)
      expect(completedTesting.routingOperation.operationNumber).toBe(3)
    })
  })
})
