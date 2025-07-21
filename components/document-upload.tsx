"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, X, Shield } from 'lucide-react'
import Button from '@/components/ui/button'
import { useAuth } from './auth-provider'

interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  message: string
  progress: number
}

interface UploadResult {
  docId: string
  fileName: string
  fileType: string
  textLength: number
  chunksCreated: number
  chunksInserted: number
}

interface DocumentUploadProps {
  onUploadSuccess?: (result: UploadResult) => void
  onUploadError?: (error: string) => void
  className?: string
}

export default function DocumentUpload({
  onUploadSuccess,
  onUploadError,
  className = ''
}: DocumentUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    message: '',
    progress: 0
  })
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, loading, showAuthModal } = useAuth()

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF and DOCX files are supported'
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return 'File size must be less than 10MB'
    }

    return null
  }

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    
    if (validationError) {
      setUploadProgress({
        status: 'error',
        message: validationError,
        progress: 0
      })
      return
    }

    setSelectedFile(file)
    setUploadProgress({
      status: 'idle',
      message: `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
      progress: 0
    })
  }, [])

  const uploadFile = async () => {
    if (!selectedFile) return

    try {
      setUploadProgress({
        status: 'uploading',
        message: 'Uploading file...',
        progress: 25
      })

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      setUploadProgress({
        status: 'processing',
        message: 'Processing document and generating embeddings...',
        progress: 75
      })

      const result = await response.json()

      if (result.success) {
        setUploadProgress({
          status: 'success',
          message: `Successfully processed ${result.data.chunksCreated} chunks`,
          progress: 100
        })

        onUploadSuccess?.(result.data)
        
        // Reset after success
        setTimeout(() => {
          setSelectedFile(null)
          setUploadProgress({
            status: 'idle',
            message: '',
            progress: 0
          })
        }, 3000)
      } else {
        throw new Error(result.error || 'Processing failed')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      setUploadProgress({
        status: 'error',
        message: errorMessage,
        progress: 0
      })

      onUploadError?.(errorMessage)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadProgress({
      status: 'idle',
      message: '',
      progress: 0
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusIcon = () => {
    switch (uploadProgress.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />
      default:
        return <Upload className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (uploadProgress.status) {
      case 'uploading':
      case 'processing':
        return 'border-blue-300 bg-blue-50/50'
      case 'success':
        return 'border-green-300 bg-green-50/50'
      case 'error':
        return 'border-red-300 bg-red-50/50'
      default:
        return dragActive ? 'border-purple-300 bg-purple-50/50' : 'border-gray-300 bg-white/5'
    }
  }

  const isProcessing = uploadProgress.status === 'uploading' || uploadProgress.status === 'processing'

  // Since login is now mandatory, this check is no longer needed

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${getStatusColor()}
          ${!isProcessing && !selectedFile ? 'cursor-pointer hover:border-purple-400 hover:bg-purple-50/30' : ''}
          ${dragActive ? 'border-purple-400 bg-purple-50/30' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center space-y-4">
          {/* Status Icon */}
          <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
            {getStatusIcon()}
          </div>

          {/* Main Message */}
          {!selectedFile ? (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Upload Legal Document
              </h3>
              <p className="text-white/70 mb-4">
                Drag and drop your PDF or DOCX file here, or click to browse
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-white/60">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>PDF, DOCX</span>
                </div>
                <div>•</div>
                <div>Max 10MB</div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {/* Selected File Info */}
              <div className="flex items-center justify-between bg-white/10 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-white/70" />
                  <div className="text-left">
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-white/60 text-sm">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                    </p>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      resetUpload()
                    }}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {uploadProgress.progress > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Message */}
              {uploadProgress.message && (
                <p className={`text-sm mb-4 ${
                  uploadProgress.status === 'error' ? 'text-red-200' :
                  uploadProgress.status === 'success' ? 'text-green-200' :
                  'text-white/70'
                }`}>
                  {uploadProgress.message}
                </p>
              )}

              {/* Action Buttons */}
              {uploadProgress.status === 'idle' && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Button
                    onClick={uploadFile}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-2"
                  >
                    Process Document
                  </Button>
                </div>
              )}

              {uploadProgress.status === 'error' && (
                <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                  <Button
                    onClick={uploadFile}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2"
                  >
                    Retry
                  </Button>
                  <Button
                    onClick={resetUpload}
                    variant="ghost"
                    className="px-4 py-2 border border-white/20 text-white hover:bg-white/10"
                  >
                    Choose Different File
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-purple-500/20 border-2 border-purple-400 border-dashed rounded-xl flex items-center justify-center">
            <div className="text-purple-200 font-semibold">Drop your file here</div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-white/50 text-sm">
          Supported formats: PDF, DOCX • Maximum size: 10MB
        </p>
      </div>
    </div>
  )
} 