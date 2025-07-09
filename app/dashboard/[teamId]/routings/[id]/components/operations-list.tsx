'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal, Edit, Trash2, Clock, User, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { EditOperationDialog } from './edit-operation-dialog'
import { DeleteOperationDialog } from './delete-operation-dialog'

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

interface OperationsListProps {
  routingId: string
  teamId: string
  operations: Operation[]
}

export function OperationsList({ routingId, teamId, operations }: OperationsListProps) {
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [deletingOperation, setDeletingOperation] = useState<Operation | null>(null)
  const router = useRouter()

  const handleEdit = (operation: Operation) => {
    setEditingOperation(operation)
  }

  const handleDelete = (operation: Operation) => {
    setDeletingOperation(operation)
  }

  const handleOperationUpdated = () => {
    setEditingOperation(null)
    router.refresh()
    toast.success('Operation updated successfully')
  }

  const handleOperationDeleted = () => {
    setDeletingOperation(null)
    router.refresh()
    toast.success('Operation deleted successfully')
  }

  if (operations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg mb-2">No Operations</CardTitle>
          <CardDescription className="text-center">
            This routing doesn&apos;t have any operations yet. Add your first operation to get started.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Op #</TableHead>
            <TableHead>Operation</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Setup Time</TableHead>
            <TableHead>Run Time</TableHead>
            <TableHead>Skills</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {operations
            .sort((a, b) => a.operationNumber - b.operationNumber)
            .map((operation) => (
              <TableRow key={operation.id}>
                <TableCell>
                  <Badge variant="outline">{operation.operationNumber}</Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{operation.operationName}</div>
                    {operation.description && (
                      <div className="text-sm text-muted-foreground">
                        {operation.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{operation.department.name}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {operation.setupTime || 0} min
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {operation.runTime || 0} min
                  </div>
                </TableCell>
                <TableCell>
                  {operation.requiredSkills?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {operation.requiredSkills.slice(0, 2).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {operation.requiredSkills.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{operation.requiredSkills.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(operation)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(operation)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {editingOperation && (
        <EditOperationDialog
          operation={editingOperation}
          routingId={routingId}
          teamId={teamId}
          onClose={() => setEditingOperation(null)}
          onSuccess={handleOperationUpdated}
        />
      )}

      {deletingOperation && (
        <DeleteOperationDialog
          operation={deletingOperation}
          routingId={routingId}
          teamId={teamId}
          onClose={() => setDeletingOperation(null)}
          onSuccess={handleOperationDeleted}
        />
      )}
    </div>
  )
}