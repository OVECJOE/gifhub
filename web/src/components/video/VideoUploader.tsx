'use client'

import { useCallback, useRef, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'

type Props = {
  onVideoSelect: (file: File) => void
  maxSize?: number
  acceptedFormats?: string[]
}

export function VideoUploader({ onVideoSelect, maxSize = 2 * 1024 * 1024 * 1024, acceptedFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'] }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    return `${(bytes / 1024).toFixed(0)}KB`
  }

  const validate = useCallback((file: File) => {
    if (file.size > maxSize) return `File too large (max ${formatFileSize(maxSize)})`
    if (!acceptedFormats.includes(file.type)) return 'Unsupported format'
    return null
  }, [acceptedFormats, maxSize])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    onVideoSelect(file)
  }, [onVideoSelect, validate])

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    onVideoSelect(file)
  }, [onVideoSelect, validate])

  return (
    <GlassCard>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border border-dashed ${dragOver ? 'bg-white/80' : 'bg-white/60'} text-black p-8 text-center`}
      >
        <p className="text-lg md:text-xl">Drag & drop a video here, or</p>
        <button type="button" className="underline" onClick={() => inputRef.current?.click()}>browse</button>
        <p className="text-sm text-gray-600 mt-2">
          Supports MP4, MOV, AVI, WebM • Max {formatFileSize(maxSize)}
        </p>
        <input ref={inputRef} type="file" accept={acceptedFormats.join(',')} className="hidden" onChange={onPick} />
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>
    </GlassCard>
  )
}


