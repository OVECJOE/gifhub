"use client"
import { useCallback, useMemo, useState } from 'react'
import { VideoUploader } from '@/app/components/video/VideoUploader'
import { TimelineSelector } from '@/app/components/video/TimelineSelector'
import { Button } from '@/app/components/ui/Button'
import { GlassCard } from '@/app/components/ui/GlassCard'
import { generateGif, type GifQuality } from '@/app/lib/ffmpeg'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [quality, setQuality] = useState<GifQuality>('high')
  const [fps, setFps] = useState<10 | 15 | 24>(15)
  const [scale, setScale] = useState<'original' | '720' | '480' | '360'>('original')
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onGenerate = useCallback(async () => {
    if (!file) return
    setBusy(true)
    try {
      const blob = await generateGif({ file, startTime: start, endTime: end, fps, quality, scale, onProgress: setProgress })
      const url = URL.createObjectURL(blob)
      setPreview(url)
    } finally {
      setBusy(false)
    }
  }, [end, file, fps, quality, scale, start])

  const downloadName = useMemo(() => (file ? `${file.name.replace(/\.[^.]+$/, '')}-${Math.round((end-start)*1000)}ms.gif` : 'output.gif'), [end, file, start])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Upload & Create GIF</h1>
      <VideoUploader onVideoSelect={setFile} />
      {file && (
        <GlassCard>
          <TimelineSelector videoFile={file} onTimeSelect={(s,e)=>{setStart(s); setEnd(e)}} maxGifDuration={10} />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block mb-2">Quality</label>
              <select className="w-full border border-gray-300 px-3 py-2 bg-white/80" value={quality} onChange={(e)=>setQuality(e.target.value as GifQuality)}>
                <option value="low">Low (256 colors)</option>
                <option value="medium">Medium (128 colors)</option>
                <option value="high">High (64 colors)</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">FPS</label>
              <select className="w-full border border-gray-300 px-3 py-2 bg-white/80" value={fps} onChange={(e)=>setFps(parseInt(e.target.value,10) as 10|15|24)}>
                <option value={10}>10 fps</option>
                <option value={15}>15 fps</option>
                <option value={24}>24 fps</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Resolution</label>
              <select className="w-full border border-gray-300 px-3 py-2 bg-white/80" value={scale} onChange={(e)=>setScale(e.target.value as 'original' | '720' | '480' | '360')}>
                <option value="original">Original</option>
                <option value="720">720p</option>
                <option value="480">480p</option>
                <option value="360">360p</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={onGenerate} disabled={busy}>Generate GIF</Button>
            </div>
          </div>
          {busy && <p className="mt-4">Processing... {Math.round(progress*100)}%</p>}
          {preview && (
            <div className="mt-6 space-y-3">
              <img src={preview} alt="GIF preview" className="border border-gray-200" />
              <a download={downloadName} href={preview} className="underline">Download</a>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  )
}


