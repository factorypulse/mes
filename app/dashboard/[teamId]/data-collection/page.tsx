import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { DataCollectionActivitiesService } from '@/lib/services/data-collection-activities'
import { ActivitiesList } from './components/activities-list'
import { CreateActivityDialog } from './components/create-activity-dialog'

interface DataCollectionPageProps {
  params: Promise<{
    teamId: string
  }>
}

export default async function DataCollectionPage({ params }: DataCollectionPageProps) {
  const { teamId } = await params
  const user = await getUser()
  
  if (!user) {
    notFound()
  }

  const activities = await DataCollectionActivitiesService.getActivitiesByTeam(teamId, false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Collection Activities</h1>
          <p className="text-muted-foreground">
            Create and manage reusable data collection templates for operations
          </p>
        </div>
        <CreateActivityDialog teamId={teamId}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Activity
          </Button>
        </CreateActivityDialog>
      </div>

      {/* Activities Section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Collection Activities</CardTitle>
          <CardDescription>
            Reusable templates that define what data to collect during operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivitiesList 
            teamId={teamId}
            activities={activities}
          />
        </CardContent>
      </Card>
    </div>
  )
}