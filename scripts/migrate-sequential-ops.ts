// Direct migration script for sequential operations
// Run with: npx tsx scripts/migrate-sequential-ops.ts

import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function migrateSequentialOperations() {
  try {
    console.log('Starting migration to sequential operations...')

    // Get all teams (you might want to specify a particular team)
    const teams = await prisma.$queryRaw`
      SELECT DISTINCT team_id FROM mes_orders
    ` as { team_id: string }[]

    console.log(`Found ${teams.length} teams with orders`)

    for (const team of teams) {
      console.log(`\nMigrating team: ${team.team_id}`)

      // Get all orders for this team
      const orders = await prisma.mESOrder.findMany({
        where: { teamId: team.team_id },
        include: {
          workOrderOperations: {
            include: {
              routingOperation: {
                select: {
                  operationNumber: true
                }
              }
            },
            orderBy: {
              routingOperation: {
                operationNumber: 'asc'
              }
            }
          }
        }
      })

      console.log(`  Processing ${orders.length} orders...`)

      for (const order of orders) {
        // Group WOOs by operation number
        const woosByOperation = new Map<number, any[]>()
        for (const woo of order.workOrderOperations) {
          const opNum = woo.routingOperation.operationNumber
          if (!woosByOperation.has(opNum)) {
            woosByOperation.set(opNum, [])
          }
          woosByOperation.get(opNum)!.push(woo)
        }

        // Find the current operation (lowest operation number with incomplete WOOs)
        let currentOperationNumber = 1
        const operationNumbers = Array.from(woosByOperation.keys()).sort((a, b) => a - b)

        for (const opNum of operationNumbers) {
          const woos = woosByOperation.get(opNum)!
          const allCompleted = woos.every(w => w.status === 'completed')

          if (!allCompleted) {
            currentOperationNumber = opNum
            break
          }

          // If all are completed, check next operation
          if (allCompleted && opNum < Math.max(...operationNumbers)) {
            continue
          }
        }

        // Update WOO statuses based on sequential logic
        let updatedCount = 0
        for (const [opNum, woos] of woosByOperation.entries()) {
          for (const woo of woos) {
            let newStatus = woo.status

            if (woo.status === 'completed' || woo.status === 'in_progress') {
              // Keep completed and in-progress as is
              continue
            } else if (opNum === currentOperationNumber) {
              // Current operation should be pending
              newStatus = 'pending'
            } else if (opNum > currentOperationNumber) {
              // Future operations should be waiting
              newStatus = 'waiting'
            }

            if (newStatus !== woo.status) {
              await prisma.mESWorkOrderOperation.update({
                where: { id: woo.id },
                data: { status: newStatus }
              })
              updatedCount++
            }
          }
        }

        if (updatedCount > 0) {
          console.log(`    Order ${order.orderNumber}: Updated ${updatedCount} WOOs`)
        }
      }
    }

    console.log('\nMigration completed successfully!')

  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateSequentialOperations()
