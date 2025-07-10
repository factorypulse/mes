'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Type, Hash, ToggleLeft, AlignLeft, List, Paperclip, Calendar, Clock } from 'lucide-react'

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

interface ViewActivityDialogProps {
  activity: DataCollectionActivity
  onClose: () => void
}

export function ViewActivityDialog({ activity, onClose }: ViewActivityDialogProps) {
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />
      case 'number': return <Hash className="h-4 w-4" />
      case 'boolean': return <ToggleLeft className="h-4 w-4" />
      case 'textarea': return <AlignLeft className="h-4 w-4" />
      case 'select': return <List className="h-4 w-4" />
      case 'file': return <Paperclip className="h-4 w-4" />
      case 'date': return <Calendar className="h-4 w-4" />
      case 'time': return <Clock className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {activity.name}
          </DialogTitle>
          <DialogDescription>
            Data collection activity details and field configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Activity Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={activity.isActive ? 'default' : 'secondary'}>
                  {activity.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <div className="mt-1 text-sm">
                {new Date(activity.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {activity.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <div className="mt-1 text-sm">
                {activity.description}
              </div>
            </div>
          )}

          {/* Fields */}
          <div>
            <h4 className="text-lg font-medium mb-4">
              Data Fields ({activity.fields.length})
            </h4>
            
            {activity.fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No fields configured
              </div>
            ) : (
              <div className="space-y-3">
                {activity.fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getFieldIcon(field.type)}
                          {field.label}
                          {field.required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <Badge className={`text-xs ${getFieldTypeColor(field.type)}`}>
                          {field.type}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="text-sm text-muted-foreground">
                        <strong>Field Name:</strong> {field.name}
                      </div>
                      
                      {field.helpText && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Help Text:</strong> {field.helpText}
                        </div>
                      )}

                      {field.defaultValue && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Default Value:</strong> {field.defaultValue}
                        </div>
                      )}

                      {/* Validation rules */}
                      {field.validation && (
                        <div className="space-y-1">
                          {field.validation.min !== undefined && (
                            <div className="text-sm text-muted-foreground">
                              <strong>Min Value:</strong> {field.validation.min}
                            </div>
                          )}
                          {field.validation.max !== undefined && (
                            <div className="text-sm text-muted-foreground">
                              <strong>Max Value:</strong> {field.validation.max}
                            </div>
                          )}
                          {field.validation.pattern && (
                            <div className="text-sm text-muted-foreground">
                              <strong>Pattern:</strong> <code className="bg-muted px-1 rounded">{field.validation.pattern}</code>
                            </div>
                          )}
                          {field.validation.options && field.validation.options.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              <strong>Options:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {field.validation.options.map((option, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {option}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}