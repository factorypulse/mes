import { prisma } from '@/lib/prisma'
import { MESRouting, MESRoutingOperation } from '@/generated/prisma'

export interface CreateRoutingInput {
  name: string
  description?: string
  version?: string
  teamId: string
  operations?: CreateRoutingOperationInput[]
}

export interface CreateRoutingOperationInput {
  operationNumber: number
  operationName: string
  description?: string
  setupTime?: number
  runTime?: number
  instructions?: string
  departmentId?: string
  requiredSkills?: any
}

export interface UpdateRoutingInput {
  name?: string
  description?: string
  version?: string
  isActive?: boolean
}

export class RoutingsService {
  // Create a new routing
  static async createRouting(input: CreateRoutingInput): Promise<MESRouting> {
    const { operations, ...routingData } = input
    
    const routing = await prisma.mESRouting.create({
      data: {
        ...routingData,
        operations: operations ? {
          create: operations.map(op => ({
            ...op,
            teamId: input.teamId
          }))
        } : undefined
      },
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
    })
    
    return routing
  }

  // Get routing by ID
  static async getRoutingById(id: string, teamId: string): Promise<MESRouting | null> {
    return await prisma.mESRouting.findFirst({
      where: {
        id,
        teamId
      },
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
    })
  }

  // Get all routings for a team
  static async getRoutingsByTeam(teamId: string, activeOnly: boolean = true): Promise<MESRouting[]> {
    return await prisma.mESRouting.findMany({
      where: {
        teamId,
        ...(activeOnly ? { isActive: true } : {})
      },
      include: {
        operations: {
          include: {
            department: true
          },
          orderBy: {
            operationNumber: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  // Update routing
  static async updateRouting(id: string, teamId: string, input: UpdateRoutingInput): Promise<MESRouting | null> {
    const routing = await prisma.mESRouting.findFirst({
      where: { id, teamId }
    })
    
    if (!routing) {
      return null
    }

    return await prisma.mESRouting.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date()
      },
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
    })
  }

  // Delete routing (soft delete by setting isActive to false)
  static async deleteRouting(id: string, teamId: string): Promise<boolean> {
    const routing = await prisma.mESRouting.findFirst({
      where: { id, teamId }
    })
    
    if (!routing) {
      return false
    }

    await prisma.mESRouting.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })
    
    return true
  }

  // Add operation to routing
  static async addOperationToRouting(routingId: string, teamId: string, operation: CreateRoutingOperationInput): Promise<MESRoutingOperation | null> {
    const routing = await prisma.mESRouting.findFirst({
      where: { id: routingId, teamId }
    })
    
    if (!routing) {
      return null
    }

    return await prisma.mESRoutingOperation.create({
      data: {
        ...operation,
        routingId,
        teamId
      },
      include: {
        department: true
      }
    })
  }

  // Update operation in routing
  static async updateRoutingOperation(operationId: string, teamId: string, input: Partial<CreateRoutingOperationInput>): Promise<MESRoutingOperation | null> {
    const operation = await prisma.mESRoutingOperation.findFirst({
      where: { id: operationId, teamId }
    })
    
    if (!operation) {
      return null
    }

    return await prisma.mESRoutingOperation.update({
      where: { id: operationId },
      data: {
        ...input,
        updatedAt: new Date()
      },
      include: {
        department: true
      }
    })
  }

  // Delete operation from routing
  static async deleteRoutingOperation(operationId: string, teamId: string): Promise<boolean> {
    const operation = await prisma.mESRoutingOperation.findFirst({
      where: { id: operationId, teamId }
    })
    
    if (!operation) {
      return false
    }

    await prisma.mESRoutingOperation.update({
      where: { id: operationId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })
    
    return true
  }
}