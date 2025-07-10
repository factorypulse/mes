import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, User, FileText, Paperclip } from 'lucide-react'
import Link from 'next/link'
import { RoutingsService } from '@/lib/services/routings'
import { getUser } from '@/lib/auth'
import { OperationAttachments } from './components/operation-attachments'

interface OperationDetailPageProps {
  params: Promise<{
    teamId: string
    id: string
    operationId: string
  }>
}

export default async function OperationDetailPage({ params }: OperationDetailPageProps) {
  const { teamId, id, operationId } = await params;
  const user = await getUser()
  if (!user) {
    notFound()
  }

  const routing = await RoutingsService.getRoutingById(id, teamId)
  if (!routing) {
    notFound()
  }

  const operation = (routing as any).operations?.find((op: any) => op.id === operationId)
  if (!operation) {
    notFound()
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/${teamId}/routings/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Routing
          </Button>
        </Link>
      </div>

      {/* Operation Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{operation.operationName}</h1>
        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
          <span>Operation #{operation.operationNumber}</span>
          <span>•</span>
          <span>{routing.name}</span>
          {operation.department && (
            <>
              <span>•</span>
              <Badge variant="outline">{operation.department.name}</Badge>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Operation Details
            </CardTitle>
            <CardDescription>
              Information about this operation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {operation.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{operation.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Setup Time</label>
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatTime(operation.setupTime)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Run Time</label>
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatTime(operation.runTime)}</span>
                </div>
              </div>
            </div>

            {operation.requiredSkills && operation.requiredSkills.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Required Skills</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {operation.requiredSkills.map((skill: any, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {operation.instructions && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Instructions</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{operation.instructions}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Attachments
            </CardTitle>
            <CardDescription>
              Work instructions, drawings, and reference materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OperationAttachments 
              routingId={id}
              operationId={operationId}
              teamId={teamId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}