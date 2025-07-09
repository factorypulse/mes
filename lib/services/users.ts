import { stackServerApp } from '@/stack'
import { prisma } from '@/lib/prisma'

export interface DepartmentAccess {
  allDepartments: boolean
  specificDepartments: string[] // department IDs
}

export interface UserWithDepartmentAccess {
  id: string
  displayName: string | null
  primaryEmail: string | null
  profileImageUrl: string | null
  departmentAccess: DepartmentAccess
  departments?: Array<{ id: string; name: string }> // Include department details
  createdAt: Date
}

export class UsersService {
  /**
   * Get all users in a team with their department assignments
   */
  static async getTeamUsers(teamId: string): Promise<UserWithDepartmentAccess[]> {
    try {
      const team = await stackServerApp.getTeam(teamId)
      if (!team) {
        throw new Error('Team not found')
      }

      const teamUsers = await team.listUsers()

      const usersWithAccess: UserWithDepartmentAccess[] = []

      for (const teamUser of teamUsers) {
        // teamUser is the user object directly in newer Stack Auth versions
        const user = teamUser
        const departmentAccess = this.parseDepartmentAccess(user.clientReadOnlyMetadata)

        // Fetch department details if user has specific departments
        let departments: Array<{ id: string; name: string }> | undefined
        if (!departmentAccess.allDepartments && departmentAccess.specificDepartments.length > 0) {
          departments = await prisma.department.findMany({
            where: {
              id: { in: departmentAccess.specificDepartments },
              teamId
            },
            select: {
              id: true,
              name: true
            }
          })
        }

        usersWithAccess.push({
          id: user.id,
          displayName: user.displayName,
          primaryEmail: user.primaryEmail,
          profileImageUrl: user.profileImageUrl,
          departmentAccess,
          departments,
          createdAt: (user as any).createdAt || new Date() // Fallback to current date if not available
        })
      }

      return usersWithAccess.sort((a, b) => a.displayName?.localeCompare(b.displayName || '') || 0)
    } catch (error) {
      console.error('Error fetching team users:', error)
      throw error
    }
  }

  /**
   * Get a specific user with their department assignments
   */
  static async getUserWithDepartmentAccess(userId: string): Promise<UserWithDepartmentAccess | null> {
    try {
      const user = await stackServerApp.getUser(userId)
      if (!user) {
        return null
      }

      const departmentAccess = this.parseDepartmentAccess(user.clientReadOnlyMetadata)

      // Fetch department details if user has specific departments
      let departments: Array<{ id: string; name: string }> | undefined
      if (!departmentAccess.allDepartments && departmentAccess.specificDepartments.length > 0) {
        // Get the user's team to filter departments by teamId
        const userTeams = await stackServerApp.listTeams()
        const teamId = user.selectedTeam?.id || userTeams[0]?.id // Use selected team or first team

        if (teamId) {
          departments = await prisma.department.findMany({
            where: {
              id: { in: departmentAccess.specificDepartments },
              teamId
            },
            select: {
              id: true,
              name: true
            }
          })
        }
      }

      return {
        id: user.id,
        displayName: user.displayName,
        primaryEmail: user.primaryEmail,
        profileImageUrl: user.profileImageUrl,
        departmentAccess,
        departments,
        createdAt: (user as any).createdAt || new Date() // Fallback to current date if not available
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  /**
   * Get a specific user with their department assignments for a specific team
   */
  static async getUserWithDepartmentAccessForTeam(userId: string, teamId: string): Promise<UserWithDepartmentAccess | null> {
    try {
      const user = await stackServerApp.getUser(userId)
      if (!user) {
        return null
      }

      const departmentAccess = this.parseDepartmentAccess(user.clientReadOnlyMetadata)

      // Fetch department details if user has specific departments
      let departments: Array<{ id: string; name: string }> | undefined
      if (!departmentAccess.allDepartments && departmentAccess.specificDepartments.length > 0) {
        departments = await prisma.department.findMany({
          where: {
            id: { in: departmentAccess.specificDepartments },
            teamId
          },
          select: {
            id: true,
            name: true
          }
        })
      }

      return {
        id: user.id,
        displayName: user.displayName,
        primaryEmail: user.primaryEmail,
        profileImageUrl: user.profileImageUrl,
        departmentAccess,
        departments,
        createdAt: (user as any).createdAt || new Date() // Fallback to current date if not available
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  /**
   * Assign department access to a user
   */
  static async assignDepartmentAccess(
    userId: string,
    teamId: string,
    departmentAccess: DepartmentAccess
  ): Promise<UserWithDepartmentAccess> {
    try {
      const user = await stackServerApp.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Verify user is part of the team
      const team = await stackServerApp.getTeam(teamId)
      if (!team) {
        throw new Error('Team not found')
      }

      const teamUsers = await team.listUsers()
      const isUserInTeam = teamUsers.some(tu => tu.id === userId)
      if (!isUserInTeam) {
        throw new Error('User is not a member of this team')
      }

      // Update user's clientReadOnlyMetadata
      const currentMetadata = user.clientReadOnlyMetadata || {}
      const updatedMetadata = {
        ...currentMetadata,
        departmentAccess
      }

      await user.update({
        clientReadOnlyMetadata: updatedMetadata
      })

      return {
        id: user.id,
        displayName: user.displayName,
        primaryEmail: user.primaryEmail,
        profileImageUrl: user.profileImageUrl,
        departmentAccess,
        createdAt: (user as any).createdAt || new Date() // Fallback to current date if not available
      }
    } catch (error) {
      console.error('Error assigning department access:', error)
      throw error
    }
  }

  /**
   * Remove a user from the team
   */
  static async removeUserFromTeam(userId: string, teamId: string): Promise<void> {
    try {
      const team = await stackServerApp.getTeam(teamId)
      if (!team) {
        throw new Error('Team not found')
      }

      await team.removeUser(userId)
    } catch (error) {
      console.error('Error removing user from team:', error)
      throw error
    }
  }

  /**
   * Check if a user has access to a specific department
   */
  static async hasAccessToDepartment(userId: string, departmentId: string): Promise<boolean> {
    try {
      const user = await this.getUserWithDepartmentAccess(userId)
      if (!user) {
        return false
      }

      const { departmentAccess } = user

      // If user has access to all departments
      if (departmentAccess.allDepartments) {
        return true
      }

      // Check if user has access to specific department
      return departmentAccess.specificDepartments.includes(departmentId)
    } catch (error) {
      console.error('Error checking department access:', error)
      return false
    }
  }

  /**
   * Get user's accessible departments (either all or specific ones)
   */
  static async getUserAccessibleDepartments(userId: string, teamId: string): Promise<string[] | 'all'> {
    try {
      const user = await this.getUserWithDepartmentAccess(userId)
      if (!user) {
        return []
      }

      const { departmentAccess } = user

      if (departmentAccess.allDepartments) {
        return 'all'
      }

      return departmentAccess.specificDepartments
    } catch (error) {
      console.error('Error getting user accessible departments:', error)
      return []
    }
  }

  /**
   * Parse department access from user metadata
   */
  private static parseDepartmentAccess(metadata: any): DepartmentAccess {
    const defaultAccess: DepartmentAccess = {
      allDepartments: false,
      specificDepartments: []
    }

    if (!metadata || !metadata.departmentAccess) {
      return defaultAccess
    }

    const { departmentAccess } = metadata

    return {
      allDepartments: Boolean(departmentAccess.allDepartments),
      specificDepartments: Array.isArray(departmentAccess.specificDepartments)
        ? departmentAccess.specificDepartments
        : []
    }
  }
}
