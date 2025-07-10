import { prisma } from '@/lib/prisma'
import type { MESPauseReason } from '@/generated/prisma'

export interface CreatePauseReasonInput {
  name: string
  description?: string
  category: 'planned' | 'unplanned' | 'maintenance' | 'quality' | 'material' | 'other'
  teamId: string
}

export interface UpdatePauseReasonInput {
  name?: string
  description?: string
  category?: 'planned' | 'unplanned' | 'maintenance' | 'quality' | 'material' | 'other'
  isActive?: boolean
}

export class PauseReasonsService {
  // Create a new pause reason
  static async createPauseReason(input: CreatePauseReasonInput): Promise<MESPauseReason> {
    return await prisma.mESPauseReason.create({
      data: input
    })
  }

  // Get pause reason by ID
  static async getPauseReasonById(id: string, teamId: string): Promise<MESPauseReason | null> {
    return await prisma.mESPauseReason.findFirst({
      where: {
        id,
        teamId
      },
      cacheStrategy: { swr: 180, ttl: 180 } // 3-minute cache for pause reason lookups
    })
  }

  // Get all pause reasons for a team
  static async getPauseReasonsByTeam(teamId: string, activeOnly = true): Promise<MESPauseReason[]> {
    return await prisma.mESPauseReason.findMany({
      where: {
        teamId,
        ...(activeOnly ? { isActive: true } : {})
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      cacheStrategy: { swr: 240, ttl: 240 } // 4-minute cache for pause reason listings
    })
  }

  // Get pause reasons by category
  static async getPauseReasonsByCategory(teamId: string, category: string, activeOnly = true): Promise<MESPauseReason[]> {
    return await prisma.mESPauseReason.findMany({
      where: {
        teamId,
        category,
        ...(activeOnly ? { isActive: true } : {})
      },
      orderBy: {
        name: 'asc'
      },
      cacheStrategy: { swr: 240, ttl: 240 } // 4-minute cache for categorized pause reasons
    })
  }

  // Update pause reason
  static async updatePauseReason(id: string, teamId: string, input: UpdatePauseReasonInput): Promise<MESPauseReason | null> {
    const pauseReason = await prisma.mESPauseReason.findFirst({
      where: { id, teamId },
      cacheStrategy: { swr: 180, ttl: 180 } // 3-minute cache for pause reason lookup
    })

    if (!pauseReason) {
      return null
    }

    return await prisma.mESPauseReason.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date()
      }
    })
  }

  // Delete pause reason (soft delete by setting isActive to false)
  static async deletePauseReason(id: string, teamId: string): Promise<boolean> {
    const pauseReason = await prisma.mESPauseReason.findFirst({
      where: { id, teamId },
      cacheStrategy: { swr: 180, ttl: 180 } // 3-minute cache for pause reason lookup
    })

    if (!pauseReason) {
      return false
    }

    // Check if this pause reason is being used in any pause events
    const pauseEvents = await prisma.mESPauseEvent.findMany({
      where: {
        pauseReasonId: id,
        teamId
      },
      take: 1,
      cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for usage checks
    })

    if (pauseEvents.length > 0) {
      // Soft delete - just deactivate it
      await prisma.mESPauseReason.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })
    } else {
      // Hard delete if not used
      await prisma.mESPauseReason.delete({
        where: { id }
      })
    }

    return true
  }

  // Get usage statistics for pause reasons
  static async getPauseReasonUsage(teamId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    pauseReason: MESPauseReason
    usage: {
      eventCount: number
      totalDurationSeconds: number
      avgDurationSeconds: number
    }
  }>> {
    const whereClause: any = { teamId }

    if (startDate || endDate) {
      whereClause.startTime = {}
      if (startDate) whereClause.startTime.gte = startDate
      if (endDate) whereClause.startTime.lte = endDate
    }

    const pauseEvents = await prisma.mESPauseEvent.findMany({
      where: whereClause,
      include: {
        pauseReason: true
      },
      cacheStrategy: { swr: 60, ttl: 60 } // 1-minute cache for usage statistics
    })

    // Group by pause reason and calculate statistics
    const stats = new Map<string, {
      pauseReason: MESPauseReason
      eventCount: number
      totalDurationSeconds: number
    }>()

    for (const event of pauseEvents) {
      const key = event.pauseReasonId

      if (!stats.has(key)) {
        stats.set(key, {
          pauseReason: event.pauseReason,
          eventCount: 0,
          totalDurationSeconds: 0
        })
      }

      const stat = stats.get(key)!
      stat.eventCount++

      // Calculate duration if end time exists
      if (event.endTime) {
        const durationSeconds = Math.floor((event.endTime.getTime() - event.startTime.getTime()) / 1000)
        stat.totalDurationSeconds += durationSeconds
      }
    }

    return Array.from(stats.values()).map(stat => ({
      pauseReason: stat.pauseReason,
      usage: {
        eventCount: stat.eventCount,
        totalDurationSeconds: stat.totalDurationSeconds,
        avgDurationSeconds: stat.eventCount > 0 ? Math.round(stat.totalDurationSeconds / stat.eventCount) : 0
      }
    })).sort((a, b) => b.usage.eventCount - a.usage.eventCount)
  }

  // Create default pause reasons for a new team
  static async createDefaultPauseReasons(teamId: string): Promise<MESPauseReason[]> {
    const defaultReasons = [
      { name: 'Machine Breakdown', description: 'Equipment failure or malfunction', category: 'unplanned' as const },
      { name: 'Material Shortage', description: 'Waiting for materials or components', category: 'material' as const },
      { name: 'Quality Issue', description: 'Quality check failure or defect found', category: 'quality' as const },
      { name: 'Preventive Maintenance', description: 'Scheduled maintenance activities', category: 'maintenance' as const },
      { name: 'Setup/Changeover', description: 'Machine setup or product changeover', category: 'planned' as const },
      { name: 'Break Time', description: 'Operator break or lunch', category: 'planned' as const },
      { name: 'Training', description: 'Operator training or instruction', category: 'other' as const },
      { name: 'Tool Change', description: 'Changing tools or fixtures', category: 'planned' as const },
      { name: 'Power Outage', description: 'Electrical power interruption', category: 'unplanned' as const },
      { name: 'Safety Issue', description: 'Safety concern or incident', category: 'unplanned' as const }
    ]

    const createdReasons: MESPauseReason[] = []

    for (const reason of defaultReasons) {
      const created = await prisma.mESPauseReason.create({
        data: {
          ...reason,
          teamId
        }
      })
      createdReasons.push(created)
    }

    return createdReasons
  }

  // Get pause reason categories with counts
  static async getPauseReasonCategoryCounts(teamId: string): Promise<Array<{
    category: string
    count: number
    activeCount: number
  }>> {
    const reasons = await prisma.mESPauseReason.findMany({
      where: { teamId },
      select: {
        category: true,
        isActive: true
      },
      cacheStrategy: { swr: 240, ttl: 240 } // 4-minute cache for category counts
    })

    const categories = new Map<string, { count: number, activeCount: number }>()

    for (const reason of reasons) {
      if (!categories.has(reason.category)) {
        categories.set(reason.category, { count: 0, activeCount: 0 })
      }

      const cat = categories.get(reason.category)!
      cat.count++
      if (reason.isActive) {
        cat.activeCount++
      }
    }

    return Array.from(categories.entries()).map(([category, stats]) => ({
      category,
      ...stats
    })).sort((a, b) => a.category.localeCompare(b.category))
  }
}
