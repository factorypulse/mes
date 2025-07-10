'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { X, Plus, Trash2 } from 'lucide-react'

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

interface FieldBuilderProps {
  field: DataCollectionField
  index: number
  onUpdate: (field: DataCollectionField) => void
  onRemove: () => void
}

export function FieldBuilder({ field, index, onUpdate, onRemove }: FieldBuilderProps) {
  const [newOption, setNewOption] = useState('')

  const updateField = (updates: Partial<DataCollectionField>) => {
    onUpdate({ ...field, ...updates })
  }

  const updateValidation = (updates: Partial<DataCollectionField['validation']>) => {
    onUpdate({
      ...field,
      validation: { ...field.validation, ...updates }
    })
  }

  const addOption = () => {
    if (newOption.trim()) {
      const options = field.validation?.options || []
      updateValidation({ options: [...options, newOption.trim()] })
      setNewOption('')
    }
  }

  const removeOption = (optionToRemove: string) => {
    const options = field.validation?.options || []
    updateValidation({ options: options.filter(opt => opt !== optionToRemove) })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addOption()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Field {index + 1}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`field-${field.id}-name`}>Field Name</Label>
            <Input
              id={`field-${field.id}-name`}
              value={field.name}
              onChange={(e) => updateField({ name: e.target.value })}
              placeholder="e.g., dimension_1"
              required
            />
          </div>
          <div>
            <Label htmlFor={`field-${field.id}-label`}>Display Label</Label>
            <Input
              id={`field-${field.id}-label`}
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="e.g., Dimension 1 (mm)"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`field-${field.id}-type`}>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value) => updateField({ type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="file">File Upload</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="time">Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id={`field-${field.id}-required`}
              checked={field.required}
              onCheckedChange={(checked) => updateField({ required: checked })}
            />
            <Label htmlFor={`field-${field.id}-required`}>Required</Label>
          </div>
        </div>

        <div>
          <Label htmlFor={`field-${field.id}-help`}>Help Text</Label>
          <Input
            id={`field-${field.id}-help`}
            value={field.helpText || ''}
            onChange={(e) => updateField({ helpText: e.target.value })}
            placeholder="Optional help text for operators"
          />
        </div>

        {/* Type-specific validation */}
        {field.type === 'number' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`field-${field.id}-min`}>Minimum Value</Label>
              <Input
                id={`field-${field.id}-min`}
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => updateValidation({ min: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor={`field-${field.id}-max`}>Maximum Value</Label>
              <Input
                id={`field-${field.id}-max`}
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => updateValidation({ max: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Optional"
              />
            </div>
          </div>
        )}

        {field.type === 'text' && (
          <div>
            <Label htmlFor={`field-${field.id}-pattern`}>Pattern (Regex)</Label>
            <Input
              id={`field-${field.id}-pattern`}
              value={field.validation?.pattern || ''}
              onChange={(e) => updateValidation({ pattern: e.target.value })}
              placeholder="Optional regex pattern"
            />
          </div>
        )}

        {field.type === 'select' && (
          <div>
            <Label>Options</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter option value"
                />
                <Button type="button" onClick={addOption} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {field.validation?.options && field.validation.options.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {field.validation.options.map((option, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {option}
                      <button
                        type="button"
                        onClick={() => removeOption(option)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(field.type === 'text' || field.type === 'number') && (
          <div>
            <Label htmlFor={`field-${field.id}-default`}>Default Value</Label>
            <Input
              id={`field-${field.id}-default`}
              type={field.type === 'number' ? 'number' : 'text'}
              value={field.defaultValue || ''}
              onChange={(e) => updateField({ defaultValue: e.target.value })}
              placeholder="Optional default value"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}