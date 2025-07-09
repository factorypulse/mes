'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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

interface CreateActivityDialogProps {
  teamId: string
  children: React.ReactNode
}

export function CreateActivityDialog({ teamId, children }: CreateActivityDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState<DataCollectionField[]>([])
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (fields.length === 0) {
        toast.error('Please add at least one field')
        return
      }

      const response = await fetch('/api/data-collection/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fields
        })
      })

      if (response.ok) {
        toast.success('Activity created successfully')
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create activity')
      }
    } catch (error) {
      toast.error('Failed to create activity')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    })
    setFields([])
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Data Collection Activity</DialogTitle>
          <DialogDescription>
            Create a reusable template for collecting data during operations
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
                placeholder="e.g., Quality Inspection"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Describe what data this activity collects..."
              />
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}