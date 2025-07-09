'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Activity {
  id: string
  name: string
  description: string
  fields: any[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface DeleteActivityDialogProps {
  activity: Activity
  teamId: string
  onClose: () => void
  onSuccess: () => void
}

export function DeleteActivityDialog({ activity, teamId, onClose, onSuccess }: DeleteActivityDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/data-collection/activities/${activity.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete activity')
      }
    } catch (error) {
      toast.error('Failed to delete activity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Activity
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this data collection activity? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="font-medium">{activity.name}</div>
          <div className="text-sm text-muted-foreground">
            {activity.description || 'No description'}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Fields: {activity.fields.length}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Activity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}