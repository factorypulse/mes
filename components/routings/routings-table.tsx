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
import { Edit, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface Routing {
  id: string
  name: string
  description: string
  version: string
  isActive: boolean
  createdAt: string
  operations: Array<{
    id: string
    operationNumber: number
    operationName: string
    setupTime: number
    runTime: number
  }>
}

export function RoutingsTable() {
  const [routings, setRoutings] = useState<Routing[]>([])
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const teamId = params.teamId as string

  useEffect(() => {
    fetchRoutings()
  }, [])

  const fetchRoutings = async () => {
    try {
      const response = await fetch('/api/routings')
      if (response.ok) {
        const data = await response.json()
        setRoutings(data)
      }
    } catch (error) {
      console.error('Error fetching routings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this routing?')) {
      try {
        const response = await fetch(`/api/routings/${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          fetchRoutings()
        }
      } catch (error) {
        console.error('Error deleting routing:', error)
      }
    }
  }

  if (loading) {
    return <div>Loading routings...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Operations</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                No routings found. Create your first routing to get started.
              </TableCell>
            </TableRow>
          ) : (
            routings.map((routing) => (
              <TableRow key={routing.id}>
                <TableCell className="font-medium">{routing.name}</TableCell>
                <TableCell>{routing.description || '-'}</TableCell>
                <TableCell>{routing.version}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {routing.operations?.length || 0} ops
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={routing.isActive ? 'default' : 'secondary'}>
                    {routing.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(routing.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(routing.id)}
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