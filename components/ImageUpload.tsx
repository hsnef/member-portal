'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
  maxSizeMB?: number
  aspectRatio?: string
  label?: string
}

export default function ImageUpload({
  value,
  onChange,
  bucket = 'event-images',
  folder = 'events',
  maxSizeMB = 5,
  aspectRatio = '16/9',
  label = 'Event Image',
}: ImageUploadProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (file: File) => {
    setError(null)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      setError(`Image must be less than ${maxSizeMB}MB`)
      return
    }

    setUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        // If bucket doesn't exist, fall back to URL input
        if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
          setError('Storage not configured. Please enter image URL manually below.')
        } else {
          setError(uploadError.message || 'Failed to upload image')
        }
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      onChange(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleRemove = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Preview or Upload Area */}
      {value ? (
        <div className="relative">
          <div
            className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
            style={{ aspectRatio }}
          >
            <img
              src={value}
              alt="Event preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = ''
                setError('Failed to load image preview')
              }}
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-white text-gray-700 rounded-md shadow-sm hover:bg-gray-50 text-sm font-medium"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer
            transition-colors duration-200
            ${dragOver ? 'border-saffron bg-orange-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          style={{ aspectRatio }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-solid border-saffron border-r-transparent mb-4"></div>
                <p className="text-sm text-gray-500">Uploading...</p>
              </>
            ) : (
              <>
                <svg
                  className="w-12 h-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to {maxSizeMB}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Manual URL input as fallback */}
      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-1">
          Or enter image URL directly:
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/event-image.jpg"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
        />
      </div>
    </div>
  )
}
