import { RoutingsService } from '@/lib/services/routings'
import { prisma } from '@/lib/prisma'

// Mock Prisma
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
      delete: jest.fn(),
    },
  },
}))

describe('RoutingsService', () => {
  const mockTeamId = 'team-123'
  const mockRoutingId = 'routing-456'
  const mockOperationId = 'operation-789'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createRouting', () => {
    it('should create a routing without operations', async () => {
      const mockRouting = {
        id: mockRoutingId,
        name: 'Test Routing',
        description: 'Test Description',
        teamId: mockTeamId,
        version: '1.0',
        isActive: true,
        operations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.mESRouting.create as jest.Mock).mockResolvedValue(mockRouting)

      const input = {
        name: 'Test Routing',
        description: 'Test Description',
        teamId: mockTeamId,
      }

      const result = await RoutingsService.createRouting(input)

      expect(prisma.mESRouting.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Routing',
          description: 'Test Description',
          teamId: mockTeamId,
        },
        include: {
          operations: {
            include: {
              department: true,
            },
            orderBy: {
              operationNumber: 'asc',
            },
          },
        },
      })

      expect(result).toEqual(mockRouting)
    })

    it('should create a routing with operations', async () => {
      const mockRouting = {
        id: mockRoutingId,
        name: 'Test Routing',
        teamId: mockTeamId,
        operations: [
          {
            id: mockOperationId,
            operationNumber: 1,
            operationName: 'Assembly',
            teamId: mockTeamId,
          },
        ],
      }

      ;(prisma.mESRouting.create as jest.Mock).mockResolvedValue(mockRouting)

      const input = {
        name: 'Test Routing',
        teamId: mockTeamId,
        operations: [
          {
            operationNumber: 1,
            operationName: 'Assembly',
            runTime: 1800,
          },
        ],
      }

      const result = await RoutingsService.createRouting(input)

      expect(prisma.mESRouting.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Routing',
          teamId: mockTeamId,
          operations: {
            create: [
              {
                operationNumber: 1,
                operationName: 'Assembly',
                runTime: 1800,
                teamId: mockTeamId,
              },
            ],
          },
        },
        include: {
          operations: {
            include: {
              department: true,
            },
            orderBy: {
              operationNumber: 'asc',
            },
          },
        },
      })

      expect(result).toEqual(mockRouting)
    })
  })

  describe('getRoutingById', () => {
    it('should return routing when found', async () => {
      const mockRouting = {
        id: mockRoutingId,
        name: 'Test Routing',
        teamId: mockTeamId,
        operations: [],
      }

      ;(prisma.mESRouting.findFirst as jest.Mock).mockResolvedValue(mockRouting)

      const result = await RoutingsService.getRoutingById(mockRoutingId, mockTeamId)

      expect(prisma.mESRouting.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockRoutingId,
          teamId: mockTeamId,
        },
        include: {
          operations: {
            include: {
              department: true,
            },
            orderBy: {
              operationNumber: 'asc',
            },
          },
        },
      })

      expect(result).toEqual(mockRouting)
    })

    it('should return null when routing not found', async () => {
      ;(prisma.mESRouting.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await RoutingsService.getRoutingById('nonexistent', mockTeamId)

      expect(result).toBeNull()
    })
  })

  describe('getRoutingsByTeam', () => {
    it('should return active routings by default', async () => {
      const mockRoutings = [
        { id: 'routing-1', isActive: true, teamId: mockTeamId },
        { id: 'routing-2', isActive: true, teamId: mockTeamId },
      ]

      ;(prisma.mESRouting.findMany as jest.Mock).mockResolvedValue(mockRoutings)

      const result = await RoutingsService.getRoutingsByTeam(mockTeamId)

      expect(prisma.mESRouting.findMany).toHaveBeenCalledWith({
        where: {
          teamId: mockTeamId,
          isActive: true,
        },
        include: {
          operations: {
            include: {
              department: true,
            },
            orderBy: {
              operationNumber: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      expect(result).toEqual(mockRoutings)
    })

    it('should return all routings when activeOnly is false', async () => {
      const mockRoutings = [
        { id: 'routing-1', isActive: true },
        { id: 'routing-2', isActive: false },
      ]

      ;(prisma.mESRouting.findMany as jest.Mock).mockResolvedValue(mockRoutings)

      const result = await RoutingsService.getRoutingsByTeam(mockTeamId, false)

      expect(prisma.mESRouting.findMany).toHaveBeenCalledWith({
        where: {
          teamId: mockTeamId,
        },
        include: {
          operations: {
            include: {
              department: true,
            },
            orderBy: {
              operationNumber: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      expect(result).toEqual(mockRoutings)
    })
  })

  describe('updateRouting', () => {
    it('should update routing when found', async () => {
      const mockExistingRouting = { id: mockRoutingId, teamId: mockTeamId }
      const mockUpdatedRouting = {
        id: mockRoutingId,
        name: 'Updated Routing',
        teamId: mockTeamId
      }

      ;(prisma.mESRouting.findFirst as jest.Mock).mockResolvedValue(mockExistingRouting)
      ;(prisma.mESRouting.update as jest.Mock).mockResolvedValue(mockUpdatedRouting)

      const updateData = { name: 'Updated Routing' }
      const result = await RoutingsService.updateRouting(mockRoutingId, mockTeamId, updateData)

      expect(prisma.mESRouting.findFirst).toHaveBeenCalledWith({
        where: { id: mockRoutingId, teamId: mockTeamId },
      })

      expect(prisma.mESRouting.update).toHaveBeenCalledWith({
        where: { id: mockRoutingId },
        data: {
          name: 'Updated Routing',
          updatedAt: expect.any(Date),
        },
        include: {
          operations: {
            include: {
              department: true,
            },
            orderBy: {
              operationNumber: 'asc',
            },
          },
        },
      })

      expect(result).toEqual(mockUpdatedRouting)
    })

    it('should return null when routing not found', async () => {
      ;(prisma.mESRouting.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await RoutingsService.updateRouting('nonexistent', mockTeamId, { name: 'Updated' })

      expect(result).toBeNull()
      expect(prisma.mESRouting.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteRouting', () => {
    it('should soft delete routing when found', async () => {
      const mockRouting = { id: mockRoutingId, teamId: mockTeamId }

      ;(prisma.mESRouting.findFirst as jest.Mock).mockResolvedValue(mockRouting)
      ;(prisma.mESRouting.update as jest.Mock).mockResolvedValue(mockRouting)

      const result = await RoutingsService.deleteRouting(mockRoutingId, mockTeamId)

      expect(prisma.mESRouting.update).toHaveBeenCalledWith({
        where: { id: mockRoutingId },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      })

      expect(result).toBe(true)
    })

    it('should return false when routing not found', async () => {
      ;(prisma.mESRouting.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await RoutingsService.deleteRouting('nonexistent', mockTeamId)

      expect(result).toBe(false)
      expect(prisma.mESRouting.update).not.toHaveBeenCalled()
    })
  })

  describe('addOperationToRouting', () => {
    it('should add operation when routing exists', async () => {
      const mockRouting = { id: mockRoutingId, teamId: mockTeamId }
      const mockOperation = {
        id: mockOperationId,
        operationNumber: 1,
        operationName: 'Assembly',
        routingId: mockRoutingId,
        teamId: mockTeamId,
      }

      ;(prisma.mESRouting.findFirst as jest.Mock).mockResolvedValue(mockRouting)
      ;(prisma.mESRoutingOperation.create as jest.Mock).mockResolvedValue(mockOperation)

      const operationData = {
        operationNumber: 1,
        operationName: 'Assembly',
        runTime: 1800,
      }

      const result = await RoutingsService.addOperationToRouting(mockRoutingId, mockTeamId, operationData)

      expect(prisma.mESRoutingOperation.create).toHaveBeenCalledWith({
        data: {
          operationNumber: 1,
          operationName: 'Assembly',
          runTime: 1800,
          routingId: mockRoutingId,
          teamId: mockTeamId,
        },
        include: {
          department: true,
        },
      })

      expect(result).toEqual(mockOperation)
    })

    it('should return null when routing not found', async () => {
      ;(prisma.mESRouting.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await RoutingsService.addOperationToRouting('nonexistent', mockTeamId, {
        operationNumber: 1,
        operationName: 'Assembly',
      })

      expect(result).toBeNull()
      expect(prisma.mESRoutingOperation.create).not.toHaveBeenCalled()
    })
  })

  describe('updateRoutingOperation', () => {
    it('should update operation when found', async () => {
      const mockExistingOperation = { id: mockOperationId, teamId: mockTeamId }
      const mockUpdatedOperation = {
        id: mockOperationId,
        operationName: 'Updated Assembly',
        teamId: mockTeamId,
      }

      ;(prisma.mESRoutingOperation.findFirst as jest.Mock).mockResolvedValue(mockExistingOperation)
      ;(prisma.mESRoutingOperation.update as jest.Mock).mockResolvedValue(mockUpdatedOperation)

      const updateData = { operationName: 'Updated Assembly' }
      const result = await RoutingsService.updateRoutingOperation(mockOperationId, mockTeamId, updateData)

      expect(prisma.mESRoutingOperation.update).toHaveBeenCalledWith({
        where: { id: mockOperationId },
        data: {
          operationName: 'Updated Assembly',
          updatedAt: expect.any(Date),
        },
        include: {
          department: true,
        },
      })

      expect(result).toEqual(mockUpdatedOperation)
    })

    it('should return null when operation not found', async () => {
      ;(prisma.mESRoutingOperation.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await RoutingsService.updateRoutingOperation('nonexistent', mockTeamId, {
        operationName: 'Updated',
      })

      expect(result).toBeNull()
      expect(prisma.mESRoutingOperation.update).not.toHaveBeenCalled()
    })
  })
})
