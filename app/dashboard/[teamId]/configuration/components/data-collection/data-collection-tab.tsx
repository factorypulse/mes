'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Plus, MoreHorizontal, Edit, Trash2, Info, Eye, Search, FileText, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { CreateActivityDialog } from './create-activity-dialog'
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

interface DataCollectionActivity {
  id: string
  name: string
  description: string
  fields: DataCollectionField[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface DataCollectionTabProps {
  teamId: string
}

export function DataCollectionTab({ teamId }: DataCollectionTabProps) {
  const [activities, setActivities] = useState<DataCollectionActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingActivity, setEditingActivity] = useState<DataCollectionActivity | null>(null)
  const [deletingActivity, setDeletingActivity] = useState<DataCollectionActivity | null>(null)
  const [viewingActivity, setViewingActivity] = useState<DataCollectionActivity | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchActivities()
  }, [teamId])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/data-collection/activities?activeOnly=false')
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to load data collection activities')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (activity: DataCollectionActivity) => {
    setEditingActivity(activity)
  }

  const handleDelete = (activity: DataCollectionActivity) => {
    setDeletingActivity(activity)
  }

  const handleView = (activity: DataCollectionActivity) => {
    setViewingActivity(activity)
  }

  const handleActivityCreated = () => {
    setShowCreateDialog(false)
    fetchActivities()
    toast.success('Activity created successfully')
  }

  const handleActivityUpdated = () => {
    setEditingActivity(null)
    fetchActivities()
    toast.success('Activity updated successfully')
  }

  const handleActivityDeleted = () => {
    setDeletingActivity(null)
    fetchActivities()
    toast.success('Activity deleted successfully')
  }

  const getFieldTypeColor = (type: string) => {
    const colors = {
      text: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      boolean: 'bg-purple-100 text-purple-800',
      textarea: 'bg-blue-100 text-blue-800',
      select: 'bg-orange-100 text-orange-800',
      file: 'bg-red-100 text-red-800',
      date: 'bg-yellow-100 text-yellow-800',
      time: 'bg-yellow-100 text-yellow-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading data collection activities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Collection Activities</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage reusable data collection templates for operations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Activity
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Activities table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Data Collection Activities ({filteredActivities.length})
          </CardTitle>
          <CardDescription>
            Manage templates that define what data to collect during operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? 'No matching activities' : 'No data collection activities'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create your first data collection activity to get started'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Activity
                </Button>
              )}
            </div>
          ) : (
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
                {filteredActivities.map((activity) => (
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
                          <Badge key={field.id} className={`text-xs ${getFieldTypeColor(field.type)}`}>
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
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateActivityDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        teamId={teamId}
        onSuccess={handleActivityCreated}
      />

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