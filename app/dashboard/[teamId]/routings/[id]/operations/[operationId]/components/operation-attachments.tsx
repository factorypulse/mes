'use client'

import { useState, useEffect } from 'react'
import { FileUpload } from '@/components/ui/file-upload'
import { FileList } from '@/components/ui/file-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Image, Download, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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

interface OperationAttachmentsProps {
  routingId: string
  operationId: string
  teamId: string
}

export function OperationAttachments({ routingId, operationId, teamId }: OperationAttachmentsProps) {
  const [attachments, setAttachments] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchAttachments()
  }, [routingId, operationId])

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/routings/${routingId}/operations/${operationId}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: FileRecord) => {
    try {
      setUploading(true)
      
      // Update the operation with the new attachment
      const response = await fetch(`/api/routings/${routingId}/operations/${operationId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileRecord: file })
      })

      if (response.ok) {
        setAttachments(prev => [...prev, file])
        toast.success('Attachment uploaded successfully')
      } else {
        toast.error('Failed to attach file to operation')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (fileId: string) => {
    try {
      const response = await fetch(`/api/routings/${routingId}/operations/${operationId}/attachments/${fileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAttachments(prev => prev.filter(file => file.id !== fileId))
        toast.success('Attachment deleted successfully')
      } else {
        toast.error('Failed to delete attachment')
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      toast.error('Delete failed')
    }
  }

  const getFilesByType = (type: string) => {
    return attachments.filter(file => {
      if (type === 'instructions') return file.attachmentType === 'instruction'
      if (type === 'images') return file.mimeType.startsWith('image/')
      if (type === 'documents') return file.mimeType === 'application/pdf' || file.mimeType.includes('document')
      return true
    })
  }

  const renderFilePreview = (file: FileRecord) => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="relative">
          <img 
            src={file.url} 
            alt={file.originalName}
            className="max-w-full h-48 object-cover rounded-md border"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(file.url, '_blank')}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const link = document.createElement('a')
                link.href = file.url
                link.download = file.originalName
                link.click()
              }}
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteAttachment(file.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    } else if (file.mimeType === 'application/pdf') {
      return (
        <div className="border rounded-md p-4 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-red-600" />
              <div>
                <p className="font-medium">{file.originalName}</p>
                <p className="text-sm text-muted-foreground">PDF Document</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = file.url
                  link.download = file.originalName
                  link.click()
                }}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteAttachment(file.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div>
        <h4 className="text-sm font-medium mb-3">Upload Attachments</h4>
        <FileUpload
          onUpload={handleFileUpload}
          attachmentType="instruction"
          accept="image/*,.pdf,.doc,.docx"
          className="mb-4"
        />
      </div>

      {/* Attachments by Type */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({attachments.length})</TabsTrigger>
          <TabsTrigger value="images">Images ({getFilesByType('images').length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({getFilesByType('documents').length})</TabsTrigger>
          <TabsTrigger value="instructions">Instructions ({getFilesByType('instructions').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No attachments uploaded yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {attachments.map((file) => (
                <Card key={file.id}>
                  <CardContent className="p-4">
                    {renderFilePreview(file)}
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{file.originalName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                          <Badge variant="outline">{file.attachmentType}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getFilesByType('images').map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  {renderFilePreview(file)}
                  <div className="mt-2">
                    <p className="font-medium">{file.originalName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="space-y-4">
            {getFilesByType('documents').map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  {renderFilePreview(file)}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          <div className="space-y-4">
            {getFilesByType('instructions').map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  {renderFilePreview(file)}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}