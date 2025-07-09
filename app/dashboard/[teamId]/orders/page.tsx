import { Suspense } from 'react'
import { OrdersTable } from '@/components/orders/orders-table'
import { CreateOrderDialog } from '@/components/orders/create-order-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage production orders and track progress
          </p>
        </div>
        <CreateOrderDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </CreateOrderDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Orders</CardTitle>
          <CardDescription>
            View and manage all production orders in your manufacturing system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading orders...</div>}>
            <OrdersTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}