import { prisma } from '@/lib/prisma'

export class DepartmentsService {
  async getDepartmentsByTeam(teamId: string) {
    try {
      const departments = await prisma.department.findMany({
        where: { teamId },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              routingOperations: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return departments
    } catch (error) {
      console.error('Error fetching departments:', error)
      throw new Error('Failed to fetch departments')
    }
  }

  async getDepartmentById(id: string) {
    try {
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              routingOperations: true
            }
          }
        }
      })

      return department
    } catch (error) {
      console.error('Error fetching department:', error)
      throw new Error('Failed to fetch department')
    }
  }

  async createDepartment(teamId: string, data: {
    name: string
    description?: string
  }) {
    try {
      const department = await prisma.department.create({
        data: {
          teamId,
          name: data.name,
          description: data.description
        }
      })

      return department
    } catch (error) {
      console.error('Error creating department:', error)
      throw new Error('Failed to create department')
    }
  }

  async updateDepartment(id: string, data: {
    name?: string
    description?: string
    isActive?: boolean
  }) {
    try {
      const department = await prisma.department.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          updatedAt: new Date()
        }
      })

      return department
    } catch (error) {
      console.error('Error updating department:', error)
      throw new Error('Failed to update department')
    }
  }

  async deleteDepartment(id: string) {
    try {
      // Check if department has any routing operations
      const operationsCount = await prisma.mESRoutingOperation.count({
        where: { departmentId: id }
      })

      if (operationsCount > 0) {
        throw new Error('Cannot delete department with existing operations')
      }

      await prisma.department.delete({
        where: { id }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting department:', error)
      throw new Error('Failed to delete department')
    }
  }
}
