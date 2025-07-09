import { Suspense } from 'react'
import { RoutingsTable } from '@/components/routings/routings-table'
import { CreateRoutingDialog } from '@/components/routings/create-routing-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RoutingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routings</h1>
          <p className="text-muted-foreground">
            Manage production routings and operations
          </p>
        </div>
        <CreateRoutingDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Routing
          </Button>
        </CreateRoutingDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Routings</CardTitle>
          <CardDescription>
            Define the sequence of operations for your production processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading routings...</div>}>
            <RoutingsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}