'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { FieldBuilder } from './field-builder'

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

interface EditActivityDialogProps {
  activity: Activity
  teamId: string
  onClose: () => void
  onSuccess: () => void
}

export function EditActivityDialog({ activity, teamId, onClose, onSuccess }: EditActivityDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState<DataCollectionField[]>(activity.fields || [])

  const [formData, setFormData] = useState({
    name: activity.name,
    description: activity.description || '',
    isActive: activity.isActive
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (fields.length === 0) {
        toast.error('Please add at least one field')
        return
      }

      const response = await fetch(`/api/data-collection/activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fields
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update activity')
      }
    } catch (error) {
      toast.error('Failed to update activity')
    } finally {
      setLoading(false)
    }
  }

  const addField = () => {
    const newField: DataCollectionField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
      validation: {},
      helpText: '',
      defaultValue: ''
    }
    setFields([...fields, newField])
  }

  const updateField = (index: number, field: DataCollectionField) => {
    const newFields = [...fields]
    newFields[index] = field
    setFields(newFields)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Collection Activity</DialogTitle>
          <DialogDescription>
            Update the activity details and fields
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Activity Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Data Fields</Label>
              <Button type="button" onClick={addField} variant="outline" size="sm">
                Add Field
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No fields added yet. Click &quot;Add Field&quot; to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <FieldBuilder
                    key={field.id}
                    field={field}
                    index={index}
                    onUpdate={(updatedField) => updateField(index, updatedField)}
                    onRemove={() => removeField(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}