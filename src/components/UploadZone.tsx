'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Check, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface UploadZoneProps {
  type: 'requirements' | 'device'
  title: string
  description: string
  onUploadSuccess?: (data: any) => void
  multiple?: boolean
}

export default function UploadZone({
  type,
  title,
  description,
  onUploadSuccess,
  multiple = false
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    setStatus('uploading')
    setMessage('Przesyłanie...')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage(data.message)
        onUploadSuccess?.(data.data)
      } else {
        setStatus('error')
        setMessage(data.error || 'Błąd przesyłania')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Błąd połączenia')
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const pdfFiles = files.filter(f => f.name.endsWith('.pdf'))

    if (pdfFiles.length === 0) {
      setStatus('error')
      setMessage('Tylko pliki PDF są akceptowane')
      return
    }

    if (multiple) {
      for (const file of pdfFiles) {
        await uploadFile(file)
      }
    } else {
      await uploadFile(pdfFiles[0])
    }
  }, [type, multiple, onUploadSuccess])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const pdfFiles = files.filter(f => f.name.endsWith('.pdf'))

    if (pdfFiles.length === 0) return

    if (multiple) {
      for (const file of pdfFiles) {
        await uploadFile(file)
      }
    } else {
      await uploadFile(pdfFiles[0])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-teal-400">{title}</h3>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>

      <div
        className={clsx(
          'upload-zone',
          isDragging && 'dragover'
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-${type}`)?.click()}
      >
        <input
          type="file"
          id={`file-${type}`}
          accept=".pdf"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {status === 'uploading' ? (
            <div className="animate-pulse">
              <Upload className="w-12 h-12 text-teal-400" />
            </div>
          ) : (
            <FileText className="w-12 h-12 text-teal-500/50" />
          )}

          <p className="text-gray-400">
            Przeciągnij PDF{multiple ? '(y)' : ''} lub{' '}
            <span className="text-teal-400 hover:underline cursor-pointer">
              wybierz plik{multiple ? 'i' : ''}
            </span>
          </p>
        </div>
      </div>

      {status !== 'idle' && (
        <div
          className={clsx(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            status === 'success' && 'bg-emerald-500/10 text-emerald-400',
            status === 'error' && 'bg-red-500/10 text-red-400',
            status === 'uploading' && 'bg-teal-500/10 text-teal-400'
          )}
        >
          {status === 'success' && <Check className="w-4 h-4" />}
          {status === 'error' && <AlertCircle className="w-4 h-4" />}
          {status === 'uploading' && (
            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
