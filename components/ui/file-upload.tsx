'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadProps {
  onUpload: (file: FileRecord) => void
  wooId?: string
  attachmentType?: string
  accept?: string
  maxSize?: number
  className?: string
}

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

export function FileUpload({ 
  onUpload, 
  wooId, 
  attachmentType = 'general',
  accept = 'image/*,.pdf,.txt,.doc,.docx',
  maxSize = 10 * 1024 * 1024,
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`)
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (wooId) formData.append('wooId', wooId)
      formData.append('attachmentType', attachmentType)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const fileRecord: FileRecord = await response.json()
      onUpload(fileRecord)
      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports images, PDFs, and documents up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>

            {uploading && (
              <div className="w-full max-w-xs">
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              disabled={uploading}
              onClick={(e) => {
                e.stopPropagation()
                openFileDialog()
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}