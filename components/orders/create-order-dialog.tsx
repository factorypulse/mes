'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CreateOrderDialogProps {
  children: React.ReactNode
}

interface Routing {
  id: string
  name: string
  version: string
}

export function CreateOrderDialog({ children }: CreateOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [routings, setRoutings] = useState<Routing[]>([])
  const [formData, setFormData] = useState({
    orderNumber: '',
    routingId: '',
    quantity: '',
    priority: '3',
    scheduledStartDate: '',
    scheduledEndDate: '',
    notes: ''
  })

  useEffect(() => {
    if (open) {
      fetchRoutings()
    }
  }, [open])

  const fetchRoutings = async () => {
    try {
      const response = await fetch('/api/routings')
      if (response.ok) {
        const data = await response.json()
        setRoutings(data)
      }
    } catch (error) {
      console.error('Error fetching routings:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          priority: parseInt(formData.priority),
          scheduledStartDate: formData.scheduledStartDate || undefined,
          scheduledEndDate: formData.scheduledEndDate || undefined,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          orderNumber: '',
          routingId: '',
          quantity: '',
          priority: '3',
          scheduledStartDate: '',
          scheduledEndDate: '',
          notes: ''
        })
        // Refresh the orders table
        window.location.reload()
      }
    } catch (error) {
      console.error('Error creating order:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Create a new production order. Work order operations will be automatically generated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="orderNumber" className="text-right">
                Order Number
              </Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="routingId" className="text-right">
                Routing
              </Label>
              <Select 
                value={formData.routingId} 
                onValueChange={(value) => setFormData({ ...formData, routingId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a routing" />
                </SelectTrigger>
                <SelectContent>
                  {routings.map((routing) => (
                    <SelectItem key={routing.id} value={routing.id}>
                      {routing.name} (v{routing.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="col-span-3"
                required
                min="1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduledStartDate" className="text-right">
                Scheduled Start
              </Label>
              <Input
                id="scheduledStartDate"
                type="date"
                value={formData.scheduledStartDate}
                onChange={(e) => setFormData({ ...formData, scheduledStartDate: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduledEndDate" className="text-right">
                Scheduled End
              </Label>
              <Input
                id="scheduledEndDate"
                type="date"
                value={formData.scheduledEndDate}
                onChange={(e) => setFormData({ ...formData, scheduledEndDate: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}