'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  File, 
  Image, 
  FileText, 
  Download, 
  Eye,
  Trash2,
  Calendar,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface FileListProps {
  files: FileRecord[]
  onDelete?: (fileId: string) => void
  showDelete?: boolean
  className?: string
}

export function FileList({ 
  files, 
  onDelete, 
  showDelete = false,
  className = ''
}: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    } else {
      return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getAttachmentTypeColor = (type: string) => {
    switch (type) {
      case 'instruction':
        return 'bg-blue-100 text-blue-800'
      case 'photo':
        return 'bg-green-100 text-green-800'
      case 'document':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!onDelete) return

    setDeletingId(fileId)
    try {
      await onDelete(fileId)
    } catch (error) {
      console.error('Error deleting file:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">No attachments</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file) => (
        <Card key={file.id} className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 pt-1">
                  {getFileIcon(file.mimeType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {file.originalName}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={getAttachmentTypeColor(file.attachmentType)}
                    >
                      {file.attachmentType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span>{formatFileSize(file.size)}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                  title="View file"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = file.url
                    link.download = file.originalName
                    link.click()
                  }}
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </Button>

                {showDelete && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                    className="text-destructive hover:text-destructive"
                    title="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}