'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Department {
  id: string
  name: string
}

interface DataCollectionActivity {
  id: string
  name: string
  description: string
  isActive: boolean
}

interface CreateOperationDialogProps {
  routingId: string
  teamId: string
  children: React.ReactNode
}

export function CreateOperationDialog({ routingId, teamId, children }: CreateOperationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [dataCollectionActivities, setDataCollectionActivities] = useState<DataCollectionActivity[]>([])
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    operationNumber: 1,
    operationName: '',
    description: '',
    departmentId: '',
    setupTime: 0,
    runTime: 0,
    instructions: ''
  })

  useEffect(() => {
    if (open) {
      fetchDepartments()
      fetchDataCollectionActivities()
      fetchNextOperationNumber()
    }
  }, [open, teamId, routingId])

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`/api/departments?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      toast.error('Failed to fetch departments')
    }
  }

  const fetchDataCollectionActivities = async () => {
    try {
      const response = await fetch('/api/data-collection/activities')
      if (response.ok) {
        const data = await response.json()
        setDataCollectionActivities(data)
      }
    } catch (error) {
      toast.error('Failed to fetch data collection activities')
    }
  }

  const fetchNextOperationNumber = async () => {
    try {
      const response = await fetch(`/api/routings/${routingId}`)
      if (response.ok) {
        const routing = await response.json()
        const maxOpNumber = Math.max(...(routing.operations?.map((op: any) => op.operationNumber) || [0]))
        setFormData(prev => ({ ...prev, operationNumber: maxOpNumber + 1 }))
      }
    } catch (error) {
      console.error('Failed to fetch routing:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/routings/${routingId}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          requiredSkills: skills
        })
      })

      if (response.ok) {
        toast.success('Operation created successfully')
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create operation')
      }
    } catch (error) {
      toast.error('Failed to create operation')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      operationNumber: 1,
      operationName: '',
      description: '',
      departmentId: '',
      setupTime: 0,
      runTime: 0,
      instructions: ''
    })
    setSkills([])
    setNewSkill('')
    setSelectedActivities([])
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Operation</DialogTitle>
          <DialogDescription>
            Add a new operation to this routing
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operationNumber">Operation Number</Label>
              <Input
                id="operationNumber"
                type="number"
                value={formData.operationNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, operationNumber: parseInt(e.target.value) }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="operationName">Operation Name</Label>
            <Input
              id="operationName"
              value={formData.operationName}
              onChange={(e) => setFormData(prev => ({ ...prev, operationName: e.target.value }))}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="setupTime">Setup Time (minutes)</Label>
              <Input
                id="setupTime"
                type="number"
                min="0"
                value={formData.setupTime}
                onChange={(e) => setFormData(prev => ({ ...prev, setupTime: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="runTime">Run Time (minutes)</Label>
              <Input
                id="runTime"
                type="number"
                min="0"
                value={formData.runTime}
                onChange={(e) => setFormData(prev => ({ ...prev, runTime: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="skills">Required Skills</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="skills"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter skill and press Enter"
                />
                <Button type="button" onClick={addSkill}>
                  Add
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
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

          <div>
            <Label>Data Collection Activities</Label>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Select activities that operators will complete during this operation
              </div>
              {dataCollectionActivities.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No data collection activities available.{' '}
                  <a href={`/dashboard/${teamId}/data-collection`} className="text-primary hover:underline">
                    Create one
                  </a>
                </div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {dataCollectionActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`activity-${activity.id}`}
                        checked={selectedActivities.includes(activity.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedActivities([...selectedActivities, activity.id])
                          } else {
                            setSelectedActivities(selectedActivities.filter(id => id !== activity.id))
                          }
                        }}
                      />
                      <Label htmlFor={`activity-${activity.id}`} className="text-sm">
                        {activity.name}
                      </Label>
                      {activity.description && (
                        <span className="text-xs text-muted-foreground">
                          - {activity.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Operation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}