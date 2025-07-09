'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal, Edit, Trash2, Info, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { EditActivityDialog } from './edit-activity-dialog'
import { DeleteActivityDialog } from './delete-activity-dialog'
import { ViewActivityDialog } from './view-activity-dialog'

interface DataCollectionField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'textarea' | 'select' | 'file' | 'date' | 'time'
  required: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: string[]
  }
  helpText?: string
  defaultValue?: any
}

interface Activity {
  id: string
  name: string
  description: string
  fields: DataCollectionField[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ActivitiesListProps {
  teamId: string
  activities: Activity[]
}

export function ActivitiesList({ teamId, activities }: ActivitiesListProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null)
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null)
  const router = useRouter()

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
  }

  const handleDelete = (activity: Activity) => {
    setDeletingActivity(activity)
  }

  const handleView = (activity: Activity) => {
    setViewingActivity(activity)
  }

  const handleActivityUpdated = () => {
    setEditingActivity(null)
    router.refresh()
    toast.success('Activity updated successfully')
  }

  const handleActivityDeleted = () => {
    setDeletingActivity(null)
    router.refresh()
    toast.success('Activity deleted successfully')
  }

  const getFieldTypeColor = (type: string) => {
    const colors = {
      text: 'default',
      number: 'secondary',
      boolean: 'outline',
      textarea: 'default',
      select: 'secondary',
      file: 'destructive',
      date: 'outline',
      time: 'outline'
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg mb-2">No Data Collection Activities</CardTitle>
          <CardDescription className="text-center">
            Create your first data collection activity to start collecting structured data during operations.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Fields</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>
                <div className="font-medium">{activity.name}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground max-w-xs truncate">
                  {activity.description || 'No description'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {activity.fields.slice(0, 3).map((field) => (
                    <Badge key={field.id} variant={getFieldTypeColor(field.type) as any} className="text-xs">
                      {field.type}
                    </Badge>
                  ))}
                  {activity.fields.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{activity.fields.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={activity.isActive ? 'default' : 'secondary'}>
                  {activity.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(activity)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(activity)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(activity)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingActivity && (
        <EditActivityDialog
          activity={editingActivity}
          teamId={teamId}
          onClose={() => setEditingActivity(null)}
          onSuccess={handleActivityUpdated}
        />
      )}

      {deletingActivity && (
        <DeleteActivityDialog
          activity={deletingActivity}
          teamId={teamId}
          onClose={() => setDeletingActivity(null)}
          onSuccess={handleActivityDeleted}
        />
      )}

      {viewingActivity && (
        <ViewActivityDialog
          activity={viewingActivity}
          onClose={() => setViewingActivity(null)}
        />
      )}
    </div>
  )
}