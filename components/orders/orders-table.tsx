'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Square, Edit, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface Order {
  id: string
  orderNumber: string
  quantity: number
  priority: number
  status: string
  scheduledStartDate?: string
  scheduledEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  notes?: string
  createdAt: string
  routing: {
    id: string
    name: string
    version: string
  }
  workOrderOperations: Array<{
    id: string
    status: string
  }>
}

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const teamId = params.teamId as string

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}/start`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error starting order:', error)
    }
  }

  const handleCompleteOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}/complete`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error completing order:', error)
    }
  }

  const handleDeleteOrder = async (id: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        const response = await fetch(`/api/orders/${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          fetchOrders()
        }
      } catch (error) {
        console.error('Error cancelling order:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'in_progress':
        return 'default'
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getProgress = (order: Order) => {
    if (!order.workOrderOperations.length) return 0
    const completed = order.workOrderOperations.filter(op => op.status === 'completed').length
    return Math.round((completed / order.workOrderOperations.length) * 100)
  }

  if (loading) {
    return <div>Loading orders...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Routing</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Scheduled Start</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8">
                No orders found. Create your first order to get started.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.routing.name}</div>
                    <div className="text-sm text-muted-foreground">v{order.routing.version}</div>
                  </div>
                </TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>
                  <Badge variant={order.priority === 1 ? 'destructive' : order.priority === 2 ? 'default' : 'secondary'}>
                    {order.priority === 1 ? 'High' : order.priority === 2 ? 'Medium' : 'Low'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(order.status) as any}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${getProgress(order)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getProgress(order)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {order.scheduledStartDate 
                    ? format(new Date(order.scheduledStartDate), 'MMM d, yyyy')
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  {format(new Date(order.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {order.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStartOrder(order.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {order.status === 'in_progress' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCompleteOrder(order.id)}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}