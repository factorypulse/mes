import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings, Plus } from 'lucide-react'
import Link from 'next/link'
import { RoutingsService } from '@/lib/services/routings'
import { getUser } from '@/lib/auth'
import { OperationsList } from './components/operations-list'
import { CreateOperationDialog } from './components/create-operation-dialog'

interface RoutingDetailPageProps {
  params: Promise<{
    teamId: string
    id: string
  }>
}

export default async function RoutingDetailPage({ params }: RoutingDetailPageProps) {
  const { teamId, id } = await params;
  const user = await getUser()
  if (!user) {
    notFound()
  }

  const routing = await RoutingsService.getRoutingById(id, teamId)

  if (!routing) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/${teamId}/routings`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Routings
          </Button>
        </Link>
      </div>

      {/* Routing Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{routing.name}</CardTitle>
              <CardDescription>{routing.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={routing.isActive ? "default" : "secondary"}>
                Version {routing.version}
              </Badge>
              <Badge variant={routing.isActive ? "default" : "outline"}>
                {routing.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Operations</p>
              <p className="font-medium">{(routing as any).operations?.length || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Est. Total Time</p>
              <p className="font-medium">
                {(routing as any).operations?.reduce((total: number, op: any) => total + (op.setupTime || 0) + (op.runTime || 0), 0) || 0} min
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(routing.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Operations</CardTitle>
              <CardDescription>
                Manage the operations that make up this routing
              </CardDescription>
            </div>
            <CreateOperationDialog 
              routingId={id}
              teamId={teamId}
            >
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Operation
              </Button>
            </CreateOperationDialog>
          </div>
        </CardHeader>
        <CardContent>
          <OperationsList 
            routingId={id}
            teamId={teamId}
            operations={(routing as any).operations || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}