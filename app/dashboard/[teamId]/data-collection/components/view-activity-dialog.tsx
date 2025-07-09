'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X } from 'lucide-react'

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

interface ViewActivityDialogProps {
  activity: Activity
  onClose: () => void
}

export function ViewActivityDialog({ activity, onClose }: ViewActivityDialogProps) {
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activity.name}</DialogTitle>
          <DialogDescription>
            Data collection activity details
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Activity Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div className="text-sm">{activity.description || 'No description'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <Badge variant={activity.isActive ? 'default' : 'secondary'}>
                    {activity.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Fields</div>
                  <div className="text-sm">{activity.fields.length} fields</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created</div>
                  <div className="text-sm">{new Date(activity.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Updated</div>
                  <div className="text-sm">{new Date(activity.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Fields</CardTitle>
              <CardDescription>
                Fields that will be presented to operators for data collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activity.fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No fields defined
                </div>
              ) : (
                <div className="space-y-4">
                  {activity.fields.map((field, index) => (
                    <Card key={field.id} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{field.label}</div>
                              <Badge variant={getFieldTypeColor(field.type) as any} className="text-xs">
                                {field.type}
                              </Badge>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Field name: {field.name}
                            </div>
                            {field.helpText && (
                              <div className="text-sm text-muted-foreground">
                                Help: {field.helpText}
                              </div>
                            )}
                            {field.defaultValue && (
                              <div className="text-sm text-muted-foreground">
                                Default: {field.defaultValue}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Field-specific details */}
                        {field.type === 'number' && (field.validation?.min !== undefined || field.validation?.max !== undefined) && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Range: {field.validation?.min ?? '∞'} to {field.validation?.max ?? '∞'}
                          </div>
                        )}

                        {field.type === 'text' && field.validation?.pattern && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Pattern: {field.validation.pattern}
                          </div>
                        )}

                        {field.type === 'select' && field.validation?.options && (
                          <div className="mt-2">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Options:</div>
                            <div className="flex flex-wrap gap-1">
                              {field.validation.options.map((option, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {option}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}