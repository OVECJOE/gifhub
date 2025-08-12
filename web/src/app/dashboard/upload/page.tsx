'use client'
import { useSession } from 'next-auth/react'
import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { VideoUploader } from '@/components/video/VideoUploader'
import { TimelineSelector } from '@/components/video/TimelineSelector'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { generateGif, type GifQuality } from '@/lib/ffmpeg'
import { useRouter } from 'next/navigation'

type Repository = { id: string; name: string }

export default function UploadPage() {
  const { status } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [quality, setQuality] = useState<GifQuality>('high')
  const [fps, setFps] = useState<10 | 15 | 24>(15)
  const [scale, setScale] = useState<'original' | '720' | '480' | '360'>('original')
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [videoMeta, setVideoMeta] = useState<{ duration: number; width: number; height: number } | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [repositoryId, setRepositoryId] = useState<string>('')
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadedGifId, setUploadedGifId] = useState<string | null>(null)

  if (status === 'unauthenticated') {
    router.push('/login')
  }

  // Load repositories lazily on first file selection
  const loadRepos = useCallback(async () => {
    if (repositories.length > 0) return // Already loaded

    setLoadingRepos(true)
    try {
      const res = await fetch('/api/repositories')
      if (res.ok) {
        const data = await res.json()
        setRepositories(data.repositories || [])
        if (data.repositories.length > 0) {
          setRepositoryId(data.repositories[0].id)
        }
      }
    } catch (error) {
      alert((error as Error).message || 'Failed to load repositories')
    } finally {
      setLoadingRepos(false)
    }
  }, [repositories.length])

  const onGenerate = useCallback(async () => {
    if (!file) return
    setBusy(true)
    setProgress(0)
    try {
      const blob = await generateGif({ 
        file, 
        startTime: start, 
        endTime: end, 
        fps, 
        quality, 
        scale, 
        onProgress: setProgress 
      })
      const url = URL.createObjectURL(blob)
      setPreview(url)

      await saveGifToCloud(blob)
    } catch (error) {
      alert((error as Error).message || 'Failed to generate GIF. Please try again.')
    } finally {
      setBusy(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, file, fps, quality, scale, start])

  const saveGifToCloud = async (blob: Blob) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', new File([blob], downloadName, { type: 'image/gif' }))
      if (repositories.length > 0) {
        form.append('repositoryId', repositories[0].id)
      }
      form.append('metadata', JSON.stringify({ 
        originalName: file?.name || 'video', 
        duration: end - start, 
        width: videoMeta?.width || 0, 
        height: videoMeta?.height || 0 
      }))
      
      const res = await fetch('/api/gifs/upload', { method: 'POST', body: form })
      if (res.ok) {
        const data = await res.json()
        setUploadedGifId(data.gif.id)
        if (repositories.length > 0) {
          setRepositoryId(repositories[0].id)
        }
      } else {
        throw new Error((await res.json()).error || 'Save failed')
      }
    } catch (error) {
      alert((error as Error).message || 'Failed to save GIF. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const saveGif = async () => {
    if (!uploadedGifId || !repositoryId) return
    
    setSaving(true)
    try {
      // If the GIF was already associated with a repository, move it
      // Otherwise, update the GIF to associate it with the selected repository
      const res = await fetch(`/api/gifs/${uploadedGifId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryId })
      })
      
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.push('/dashboard/gifs')
      } else {
        throw new Error((await res.json()).error || 'Failed to associate GIF with repository')
      }
    } catch (error) {
      alert((error as Error).message || 'Failed to save GIF. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const downloadName = useMemo(() =>
    file ? `${file.name.replace(/\.[^.]+$/, '')}-${Math.round((end - start) * 1000)}ms.gif` : 'output.gif',
    [end, file, start]
  )

  const estimatedSize = useMemo(() => {
    if (!file || end <= start || !videoMeta) return null
    const duration = end - start
    const width = videoMeta.width
    const height = videoMeta.height

    // Apply scale factor to dimensions
    let scaledWidth = width
    let scaledHeight = height
    if (scale !== 'original') {
      const maxWidth = scale === '720' ? 1280 : scale === '480' ? 854 : 640
      if (width > maxWidth) {
        scaledWidth = maxWidth
        scaledHeight = Math.round((height * maxWidth) / width)
      }
    }

    const totalFrames = duration * fps
    const pixels = scaledWidth * scaledHeight

    // More accurate GIF size estimation based on real-world data
    // GIF compression varies significantly with content complexity and color count
    let bytesPerPixelPerFrame: number
    if (quality === 'high') {
      // 64 colors - better quality but larger
      bytesPerPixelPerFrame = pixels > 500000 ? 0.15 : pixels > 200000 ? 0.25 : 0.4
    } else if (quality === 'medium') {
      // 128 colors - balanced
      bytesPerPixelPerFrame = pixels > 500000 ? 0.12 : pixels > 200000 ? 0.2 : 0.3
    } else {
      // 256 colors - smaller but lower quality
      bytesPerPixelPerFrame = pixels > 500000 ? 0.08 : pixels > 200000 ? 0.15 : 0.25
    }

    // Base size calculation
    let estimatedBytes = totalFrames * pixels * bytesPerPixelPerFrame

    // Apply duration penalty (longer GIFs compress less efficiently)
    if (duration > 10) estimatedBytes *= 1.3
    else if (duration > 5) estimatedBytes *= 1.1

    // Apply frame rate penalty (higher fps = less compression)
    if (fps === 24) estimatedBytes *= 1.2
    else if (fps === 15) estimatedBytes *= 1.05

    // GIF header and metadata overhead
    estimatedBytes += 1024 + (totalFrames * 20)

    // Add variance range (±30%)
    const minBytes = estimatedBytes * 0.7
    const maxBytes = estimatedBytes * 1.3

    const formatSize = (bytes: number) =>
      bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`

    return `${formatSize(minBytes)} - ${formatSize(maxBytes)}`
  }, [file, end, start, fps, quality, scale, videoMeta])

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-4xl font-bold">Upload & Create GIF</h1>
        <div className="h-64 bg-gray-200 animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="bg-white/40 backdrop-blur-sm border border-gray-200/50 p-4">
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button variant="secondary" className="text-base px-4 py-2">
              ← Back to Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/gifs">
            <Button variant="secondary" className="text-base px-4 py-2">
              🎬 My GIFs
            </Button>
          </Link>
          <Link href="/dashboard/repositories">
            <Button variant="secondary" className="text-base px-4 py-2">
              📁 My Repositories
            </Button>
          </Link>
          <Link href="/dashboard/profile">
            <Button variant="secondary" className="text-base px-4 py-2">
              👤 Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold">Upload & Create GIF</h1>
        <p className="text-gray-600 mt-1">Transform your videos into high-quality GIFs</p>
      </div>

      {/* Upload Section */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">📹 Select Video</h2>
        <VideoUploader
          onVideoSelect={(f) => {
            setFile(f)
            setPreview(null)
            setSaved(false)
            loadRepos()
          }}
        />
        {file && (
          <div className="mt-4 p-4 bg-white/50 border border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎬</div>
              <div>
                <div className="font-medium truncate max-w-[80%]">{file.name}</div>
                <div className="text-sm text-gray-600">
                  {(file.size / (1024 * 1024)).toFixed(1)}MB
                  {videoMeta && ` • ${videoMeta.width}×${videoMeta.height} • ${videoMeta.duration.toFixed(1)}s`}
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Timeline Selection */}
      {file && (
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">✂️ Select Timeline</h2>
          <TimelineSelector
            videoFile={file}
            onTimeSelect={(s, e) => { setStart(s); setEnd(e) }}
            onMetadata={(d, w, h) => setVideoMeta({ duration: d, width: w, height: h })}
            maxGifDuration={videoMeta && videoMeta.duration > 300 ? 60 : 30}
          />
          {end > start && (
            <div className="mt-4 p-4 bg-white/50 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Selected: {(end - start).toFixed(1)}s</div>
                  <div className="text-sm text-gray-600">
                    From {start.toFixed(1)}s to {end.toFixed(1)}s
                  </div>
                </div>
                {estimatedSize && (
                  <div className="text-right">
                    <div className="font-medium">Est. Size</div>
                    <div className="text-sm text-gray-600">{estimatedSize}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* GIF Settings */}
      {file && end > start && (
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">⚙️ GIF Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Quality</label>
              <select
                className="w-full border border-gray-300 px-4 py-3 bg-white/80 text-lg"
                value={quality}
                onChange={(e) => setQuality(e.target.value as GifQuality)}
              >
                <option value="high">🎯 High (64 colors)</option>
                <option value="medium">⚖️ Medium (128 colors)</option>
                <option value="low">💾 Low (256 colors)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Frame Rate</label>
              <select
                className="w-full border border-gray-300 px-4 py-3 bg-white/80 text-lg"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value, 10) as 10 | 15 | 24)}
              >
                <option value={10}>🐌 10 fps (Smaller)</option>
                <option value={15}>⚡ 15 fps (Balanced)</option>
                <option value={24}>🚀 24 fps (Smooth)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Resolution</label>
              <select
                className="w-full border border-gray-300 px-4 py-3 bg-white/80 text-lg"
                value={scale}
                onChange={(e) => setScale(e.target.value as 'original' | '720' | '480' | '360')}
              >
                <option value="original">📺 Original</option>
                <option value="720">🎬 720p HD</option>
                <option value="480">📱 480p</option>
                <option value="360">💾 360p (Compact)</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={onGenerate}
              disabled={busy}
              className="text-lg px-8 py-4"
            >
              {busy ? `🔄 Generating... ${Math.round(progress * 100)}%` : '🎨 Generate GIF'}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* GIF Preview & Save */}
      {preview && (
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">🎉 Your GIF is Ready!</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              <div className="bg-white/50 border border-gray-200/50 p-4 text-center">
                <img
                  src={preview}
                  alt="GIF preview"
                  className="max-w-full h-auto mx-auto border border-gray-300"
                />
              </div>
              <div className="mt-3 text-center">
                <a
                  download={downloadName}
                  href={preview}
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  💾 Download GIF
                </a>
              </div>
            </div>

            {/* Save Options */}
            <div>
              {uploading ? (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">📤</div>
                  <p>Saving your GIF to the cloud...</p>
                </div>
              ) : uploadedGifId ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-center">
                    ✅ GIF saved successfully to the cloud!
                  </div>
                  
                  {loadingRepos ? (
                    <div className="text-center py-4">
                      <div className="text-xl mb-2">⏳</div>
                      <p>Loading repositories...</p>
                    </div>
                  ) : repositories.length > 0 ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Move to Repository</label>
                        <select 
                          className="w-full border border-gray-300 px-4 py-3 bg-white/80 text-lg" 
                          value={repositoryId} 
                          onChange={(e) => setRepositoryId(e.target.value)}
                        >
                          {repositories.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {saved ? (
                        <div className="p-4 bg-green-100 border border-green-300 text-green-800 text-center">
                          ✅ GIF moved to repository successfully!
                        </div>
                      ) : (
                        <Button 
                          onClick={saveGif}
                          disabled={saving || !repositoryId}
                          className="w-full text-lg py-4"
                        >
                          {saving ? '📁 Moving...' : '📁 Move to Repository'}
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-2xl mb-2">📁</div>
                      <p className="mb-2">GIF saved to cloud successfully!</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Create a repository to organize your GIFs and make them easily accessible.
                      </p>
                      <Link href="/dashboard/repositories">
                        <Button>Create Repository</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">💾</div>
                  <p>GIF will be saved to the cloud after generation</p>
                  {repositories.length === 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                      💡 No repositories yet? No problem! Your GIF will be saved and you can organize it later.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
