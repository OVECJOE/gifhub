'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { downloadFile, formatFileSize, formatDuration } from '@/lib/utils'

type Gif = {
  id: string
  filename: string
  originalName: string
  downloads: number
  createdAt: string
  fileSize: number
  duration: number
  width: number
  height: number
  repository: {
    id: string
    name: string
    description?: string
    isPublic: boolean
  }
}

export default function GifDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { status } = useSession()
  const [gif, setGif] = useState<Gif | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [id, setId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchGif()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id])

  const fetchGif = async () => {
    try {
      const res = await fetch(`/api/gifs/${id}`)
      if (res.ok) {
        const data = await res.json()
        setGif(data.gif)
      } else if (res.status === 404) {
        notFound()
      }
    } catch (error) {
      console.error('Failed to fetch GIF:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteGif = async () => {
    if (!confirm('Are you sure you want to delete this GIF? This action cannot be undone.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/gifs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/gifs')
      }
    } catch (error) {
      console.error('Failed to delete GIF:', error)
      alert('Failed to delete GIF. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200/50 animate-pulse"></div>
        <div className="h-64 bg-gray-200 animate-pulse"></div>
      </div>
    )
  }

  if (!gif) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="bg-white/40 backdrop-blur-sm border border-gray-200/50 p-4">
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/gifs">
            <Button variant="secondary" className="text-base px-4 py-2">
              ← Back to GIFs
            </Button>
          </Link>
          <Link href="/dashboard/upload">
            <Button className="text-base px-4 py-2">
              📹 Upload Video
            </Button>
          </Link>
          <Link href="/dashboard/repositories">
            <Button variant="secondary" className="text-base px-4 py-2">
              📁 My Repositories
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold">{gif.originalName}</h1>
        <p className="text-gray-600 mt-1">
          Created on {new Date(gif.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GIF Preview */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="bg-white/50 border border-gray-200/50 p-4 text-center">
            <img 
              src={gif.filename} 
              alt={gif.originalName}
              className="max-w-full h-auto mx-auto border border-gray-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
                const parent = (e.target as HTMLImageElement).parentElement
                if (parent) {
                  parent.innerHTML = '<div class="text-4xl">🎬</div><div class="text-sm text-gray-600">GIF Preview</div>'
                }
              }}
            />
          </div>
          
          <div className="mt-4 flex gap-3">
            <Button 
              onClick={() => downloadFile(gif.filename, `${gif.id}.gif`)}
              className="flex-1"
            >
              💾 Download GIF
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(gif.filename)
                alert('GIF URL copied to clipboard!')
              }}
            >
              📋 Copy URL
            </Button>
          </div>
        </GlassCard>

        {/* GIF Details */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Original Name</label>
              <p className="text-lg font-medium">{gif.originalName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Dimensions</label>
                <p className="text-lg">{gif.width} × {gif.height}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Duration</label>
                <p className="text-lg">{formatDuration(gif.duration)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">File Size</label>
                <p className="text-lg">{formatFileSize(gif.fileSize)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Downloads</label>
                <p className="text-lg">{gif.downloads}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Repository</label>
              <Link 
                href={`/dashboard/repositories/${gif.repository.id}`}
                className="text-lg text-blue-600 hover:underline"
              >
                📁 {gif.repository.name}
              </Link>
              {gif.repository.description && (
                <p className="text-sm text-gray-600 mt-1">{gif.repository.description}</p>
              )}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                  gif.repository.isPublic 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {gif.repository.isPublic ? '🌐 Public' : '🔒 Private'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Created</label>
              <p className="text-lg">{new Date(gif.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Actions */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        
        <div className="flex flex-wrap gap-4">
          {gif.repository && (
            <Link href={`/dashboard/repositories/${gif.repository.id}`}>
              <Button variant="secondary">
                📁 View Repository
              </Button>
            </Link>
          )}
          <Link href="/dashboard/upload">
            <Button variant="secondary">
              📹 Create Another GIF
            </Button>
          </Link>
          
          <Button 
            variant="secondary"
            className="hover:bg-red-100 hover:text-red-600"
            onClick={deleteGif}
            disabled={deleting}
          >
            {deleting ? '🗑️ Deleting...' : '🗑️ Delete GIF'}
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
