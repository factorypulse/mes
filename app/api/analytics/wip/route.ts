import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { UsersService } from '@/lib/services/users'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.selectedTeam?.id) {
      return NextResponse.json({ error: 'No team selected' }, { status: 400 })
    }

    const teamId = user.selectedTeam.id

    // Get user's accessible departments
    const userAccessibleDepartments = await UsersService.getUserAccessibleDepartments(user.id, teamId)

    // Build department filter for queries
    let departmentFilter: any = {}
    if (userAccessibleDepartments !== 'all' && Array.isArray(userAccessibleDepartments)) {
      if (userAccessibleDepartments.length === 0) {
        // User has no department access, return empty WIP data
        return NextResponse.json({
          totalWipOperations: 0,
          wipByDepartment: [],
          wipByStatus: {
            pending: 0,
            in_progress: 0,
            paused: 0,
            waiting: 0
          },
          operationsBoard: [],
          bottlenecks: []
        })
      }

      departmentFilter = {
        routingOperation: {
          departmentId: { in: userAccessibleDepartments }
        }
      }
    }

    // Get WIP operations by status
    const wipByStatus = await prisma.mESWorkOrderOperation.groupBy({
      by: ['status'],
      where: {
        order: { teamId },
        status: { in: ['pending', 'in_progress', 'paused', 'waiting'] },
        ...departmentFilter
      },
      _count: {
        id: true
      }
    })

    // Get WIP operations with details for operations board
    const operationsBoard = await prisma.mESWorkOrderOperation.findMany({
      where: {
        order: { teamId },
        status: { in: ['pending', 'in_progress', 'paused', 'waiting'] },
        ...departmentFilter
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            quantity: true,
            routing: {
              select: {
                name: true
              }
            }
          }
        },
        routingOperation: {
          select: {
            operationName: true,
            operationNumber: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
      },
      orderBy: [
        { status: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    // Calculate WIP by status from groupBy result
    const wipByStatusMap = wipByStatus.reduce((acc, item) => {
      acc[item.status as keyof typeof acc] = item._count.id || 0
      return acc
    }, {
      pending: 0,
      in_progress: 0,
      paused: 0,
      waiting: 0
    })

    // Get department details
    const departments = await prisma.department.findMany({
      where: { teamId },
      select: {
        id: true,
        name: true
      }
    })

    // Calculate bottlenecks - departments with high WIP counts
    const wipByDept = await prisma.mESWorkOrderOperation.groupBy({
      by: ['routingOperationId'],
      where: {
        order: { teamId },
        status: { in: ['pending', 'in_progress', 'paused', 'waiting'] },
        ...departmentFilter
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get routing operation details for bottleneck analysis
    const routingOperations = await prisma.mESRoutingOperation.findMany({
      where: {
        id: { in: wipByDept.map(w => w.routingOperationId) }
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const bottlenecks = wipByDept.slice(0, 5).map(item => {
      const routingOp = routingOperations.find(ro => ro.id === item.routingOperationId)
      return {
        departmentId: routingOp?.department?.id || '',
        departmentName: routingOp?.department?.name || 'Unknown',
        operationName: routingOp?.operationName || 'Unknown',
        wipCount: item._count.id || 0,
        severity: (item._count.id || 0) > 10 ? 'high' : (item._count.id || 0) > 5 ? 'medium' : 'low'
      }
    })

    // Transform operations board data
    const boardData = operationsBoard.map(op => ({
      id: op.id,
      orderNumber: op.order.orderNumber,
      routingName: op.order.routing.name,
      operationName: op.routingOperation.operationName,
      operationNumber: op.routingOperation.operationNumber,
      department: op.routingOperation.department?.name || 'Unassigned',
      departmentId: op.routingOperation.department?.id || '',
      operatorName: op.operatorId ? `Operator ${op.operatorId.slice(0, 8)}` : 'Unassigned',
      status: op.status,
      quantityCompleted: op.quantityCompleted || 0,
      quantityToProduce: op.order.quantity || 0,
      actualStartTime: op.actualStartTime?.toISOString() || null,
      updatedAt: op.updatedAt.toISOString()
    }))

    // Calculate department WIP summary
    const deptWipSummary = departments.map(dept => {
      const deptOperations = boardData.filter(op => op.departmentId === dept.id)
      return {
        id: dept.id,
        name: dept.name,
        wipCount: deptOperations.length,
        inProgress: deptOperations.filter(op => op.status === 'in_progress').length,
        paused: deptOperations.filter(op => op.status === 'paused').length,
        pending: deptOperations.filter(op => op.status === 'pending').length,
        waiting: deptOperations.filter(op => op.status === 'waiting').length
      }
    }).filter(dept => dept.wipCount > 0)

    return NextResponse.json({
      totalWipOperations: operationsBoard.length,
      wipByDepartment: deptWipSummary,
      wipByStatus: wipByStatusMap,
      operationsBoard: boardData,
      bottlenecks
    })
  } catch (error) {
    console.error('Error fetching WIP analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WIP analytics' },
      { status: 500 }
    )
  }
}