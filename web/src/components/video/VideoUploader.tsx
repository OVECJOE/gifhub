'use client'

import { useCallback, useRef, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'

type Props = {
  onVideoSelect: (file: File) => void
  maxSize?: number
  acceptedFormats?: string[]
}

export function VideoUploader({ onVideoSelect, maxSize = 100 * 1024 * 1024, acceptedFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'] }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const validate = useCallback((file: File) => {
    if (file.size > maxSize) return 'File too large (max 100MB)'
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
        <input ref={inputRef} type="file" accept={acceptedFormats.join(',')} className="hidden" onChange={onPick} />
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>
    </GlassCard>
  )
}


