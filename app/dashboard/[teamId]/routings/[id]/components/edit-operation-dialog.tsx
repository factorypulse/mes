'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Department {
  id: string
  name: string
}

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

interface EditOperationDialogProps {
  operation: Operation
  routingId: string
  teamId: string
  onClose: () => void
  onSuccess: () => void
}

export function EditOperationDialog({ operation, routingId, teamId, onClose, onSuccess }: EditOperationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [skills, setSkills] = useState<string[]>(operation.requiredSkills || [])
  const [newSkill, setNewSkill] = useState('')

  const [formData, setFormData] = useState({
    operationNumber: operation.operationNumber,
    operationName: operation.operationName,
    description: operation.description || '',
    departmentId: operation.department.id,
    setupTime: operation.setupTime || 0,
    runTime: operation.runTime || 0,
    instructions: operation.instructions || ''
  })

  useEffect(() => {
    fetchDepartments()
  }, [teamId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/routings/${routingId}/operations/${operation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          requiredSkills: skills
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update operation')
      }
    } catch (error) {
      toast.error('Failed to update operation')
    } finally {
      setLoading(false)
    }
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Operation</DialogTitle>
          <DialogDescription>
            Update the operation details
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Operation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}