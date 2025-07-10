'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DataCollectionActivity {
  id: string
  name: string
  description: string
  fields: any[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface DeleteActivityDialogProps {
  activity: DataCollectionActivity
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete activity')
      }

      onSuccess()
    } catch (error) {
      console.error('Error deleting activity:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete Data Collection Activity</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;<strong>{activity.name}</strong>&quot;? 
            This will permanently remove the activity and all its field definitions.
          </p>
          
          {activity.fields.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                This activity has <strong>{activity.fields.length}</strong> field{activity.fields.length !== 1 ? 's' : ''} 
                that will also be deleted.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Activity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}