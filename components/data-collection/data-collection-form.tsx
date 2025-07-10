'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { FileList } from '@/components/ui/file-list'
import { ClipboardList, AlertCircle } from 'lucide-react'

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
}

interface DataCollectionFormProps {
  activities: DataCollectionActivity[]
  wooId: string
  onSubmit: (data: Record<string, any>) => void
  initialData?: Record<string, any>
  className?: string
}

interface FileRecord {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedBy: string
  uploadedAt: string
  attachmentType: string
}

export function DataCollectionForm({ 
  activities, 
  wooId, 
  onSubmit, 
  initialData = {},
  className = ''
}: DataCollectionFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [fileData, setFileData] = useState<Record<string, FileRecord[]>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Initialize form data with default values
    const defaultData: Record<string, any> = {}
    activities.forEach(activity => {
      activity.fields.forEach(field => {
        const key = `${activity.id}_${field.name}`
        if (field.defaultValue !== undefined && formData[key] === undefined) {
          defaultData[key] = field.defaultValue
        }
      })
    })
    setFormData(prev => ({ ...prev, ...defaultData }))
  }, [activities])

  const handleInputChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }))
    
    // Clear error when field is updated
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: ''
      }))
    }
  }

  const handleFileUpload = (fieldKey: string, file: FileRecord) => {
    setFileData(prev => ({
      ...prev,
      [fieldKey]: [...(prev[fieldKey] || []), file]
    }))
    
    // Update form data with file reference
    const currentFiles = fileData[fieldKey] || []
    const updatedFiles = [...currentFiles, file]
    handleInputChange(fieldKey, updatedFiles.map(f => f.id))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    activities.forEach(activity => {
      activity.fields.forEach(field => {
        const key = `${activity.id}_${field.name}`
        const value = formData[key]
        
        if (field.required && (value === undefined || value === null || value === '')) {
          newErrors[key] = `${field.label} is required`
          return
        }
        
        if (field.validation) {
          const validation = field.validation
          
          if (field.type === 'number' && value !== undefined && value !== '') {
            const numValue = Number(value)
            if (validation.min !== undefined && numValue < validation.min) {
              newErrors[key] = `${field.label} must be at least ${validation.min}`
            }
            if (validation.max !== undefined && numValue > validation.max) {
              newErrors[key] = `${field.label} must be at most ${validation.max}`
            }
          }
          
          if (field.type === 'text' && value && validation.pattern) {
            const regex = new RegExp(validation.pattern)
            if (!regex.test(value)) {
              newErrors[key] = `${field.label} format is invalid`
            }
          }
        }
      })
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const renderField = (activity: DataCollectionActivity, field: DataCollectionField) => {
    const fieldKey = `${activity.id}_${field.name}`
    const value = formData[fieldKey] || ''
    const hasError = errors[fieldKey]

    switch (field.type) {
      case 'text':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldKey}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              placeholder={field.helpText}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldKey}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(fieldKey, parseFloat(e.target.value) || '')}
              placeholder={field.helpText}
              min={field.validation?.min}
              max={field.validation?.max}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        )

      case 'boolean':
        return (
          <div key={fieldKey} className="flex items-center space-x-2">
            <Switch
              id={fieldKey}
              checked={value === true}
              onCheckedChange={(checked) => handleInputChange(fieldKey, checked)}
            />
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {hasError && <p className="text-sm text-red-500 mt-1">{hasError}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldKey}
              value={value}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              placeholder={field.helpText}
              rows={3}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleInputChange(fieldKey, val)}>
              <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.helpText || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.validation?.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        )

      case 'file':
        return (
          <div key={fieldKey} className="space-y-3">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <FileUpload
              onUpload={(file) => handleFileUpload(fieldKey, file)}
              wooId={wooId}
              attachmentType={field.name}
              className="mb-3"
            />
            {fileData[fieldKey] && fileData[fieldKey].length > 0 && (
              <FileList files={fileData[fieldKey]} />
            )}
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldKey}
              type="date"
              value={value}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        )

      case 'time':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldKey}
              type="time"
              value={value}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-sm text-red-500">{hasError}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No data collection activities assigned to this operation
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {activities.map((activity) => (
        <Card key={activity.id}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {activity.name}
            </CardTitle>
            {activity.description && (
              <p className="text-sm text-muted-foreground">
                {activity.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {activity.fields.map((field) => renderField(activity, field))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {Object.keys(errors).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Please fix the errors above before continuing
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}