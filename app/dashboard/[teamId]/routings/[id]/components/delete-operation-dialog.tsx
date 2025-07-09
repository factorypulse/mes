'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Operation {
  id: string
  operationNumber: number
  operationName: string
  description: string
  setupTime: number
  runTime: number
  instructions: string
  requiredSkills: string[]
  department: {
    id: string
    name: string
  }
}

interface DeleteOperationDialogProps {
  operation: Operation
  routingId: string
  teamId: string
  onClose: () => void
  onSuccess: () => void
}

export function DeleteOperationDialog({ operation, routingId, teamId, onClose, onSuccess }: DeleteOperationDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/routings/${routingId}/operations/${operation.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete operation')
      }
    } catch (error) {
      toast.error('Failed to delete operation')
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
            Delete Operation
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this operation? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="font-medium">Operation #{operation.operationNumber}</div>
          <div className="text-sm text-muted-foreground">{operation.operationName}</div>
          <div className="text-sm text-muted-foreground">Department: {operation.department.name}</div>
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
            {loading ? 'Deleting...' : 'Delete Operation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}