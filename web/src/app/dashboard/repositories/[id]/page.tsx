'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'

type Repository = {
  id: string
  name: string
  description?: string
  isPublic: boolean
  views: number
  gifs: Array<{
    id: string
    filename: string
    originalName: string
    downloads: number
    createdAt: string
    fileSize: number
    duration: number
    width: number
    height: number
  }>
  createdAt: string
  updatedAt: string
}

export default function RepositoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { status } = useSession()
  const [repo, setRepo] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [id, setId] = useState<string>('')

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchRepository()
    } else if (status === 'unauthenticated') {
      redirect('/login')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id])

  const fetchRepository = async () => {
    try {
      const res = await fetch(`/api/repositories/${id}`)
      if (res.ok) {
        const data = await res.json()
        setRepo(data.repository)
      } else if (res.status === 404) {
        notFound()
      }
    } catch (error) {
      console.error('Failed to fetch repository:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteGif = async (gifId: string) => {
    if (!confirm('Are you sure you want to delete this GIF?')) return

    try {
      const res = await fetch(`/api/gifs/${gifId}`, { method: 'DELETE' })
      if (res.ok) {
        setRepo(prev => prev ? {
          ...prev,
          gifs: prev.gifs.filter(gif => gif.id !== gifId)
        } : null)
      }
    } catch (error) {
      console.error('Failed to delete GIF:', error)
    }
  }

  const deleteRepository = async () => {
    if (!confirm('Are you sure you want to delete this repository? This will delete all GIFs in it. This action cannot be undone.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/repositories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        redirect('/dashboard/repositories')
      }
    } catch (error) {
      console.error('Failed to delete repository:', error)
      setDeleting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse"></div>
        <div className="h-64 bg-gray-200 animate-pulse"></div>
      </div>
    )
  }

  if (!repo) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="bg-white/40 backdrop-blur-sm border border-gray-200/50 p-4">
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/repositories">
            <Button variant="secondary" className="text-base px-4 py-2">
              ← Back to Repositories
            </Button>
          </Link>
          <Link href="/dashboard/upload">
            <Button className="text-base px-4 py-2">
              📹 Upload Video
            </Button>
          </Link>
          <Link href={`/dashboard/repositories/${id}/edit`}>
            <Button variant="secondary" className="text-base px-4 py-2">
              ✏️ Edit Repository
            </Button>
          </Link>
        </div>
      </div>

      {/* Repository Header */}
      <div className="flex flex-col md:flex-row items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{repo.name}</h1>
            <span className={`px-3 py-1 text-sm font-medium ${
              repo.isPublic 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {repo.isPublic ? '🌍 Public' : '🔒 Private'}
            </span>
          </div>
          {repo.description && (
            <p className="text-gray-600 text-lg mb-2">{repo.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>👀 {repo.views} views</span>
            <span>🎬 {repo.gifs.length} GIFs</span>
            <span>📅 Created {new Date(repo.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0 md:ml-4 w-full md:w-auto">
          {repo.isPublic && (
            <Link href={`/repository/${repo.id}`} target="_blank" className="w-full md:w-auto">
              <Button variant="secondary" className="text-sm px-4 py-2 w-full md:w-auto">
                🌍 View Public
              </Button>
            </Link>
          )}
          <Button 
            variant="secondary" 
            className="text-sm px-4 py-2 hover:bg-red-100 hover:text-red-600 w-full md:w-auto"
            onClick={deleteRepository}
            disabled={deleting}
          >
            {deleting ? '🗑️ Deleting...' : '🗑️ Delete'}
          </Button>
        </div>
      </div>

      {/* Repository Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{repo.gifs.length}</div>
            <div className="text-sm text-gray-600">Total GIFs</div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{repo.views}</div>
            <div className="text-sm text-gray-600">Views</div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {repo.gifs.reduce((sum, gif) => sum + gif.downloads, 0)}
            </div>
            <div className="text-sm text-gray-600">Downloads</div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {(repo.gifs.reduce((sum, gif) => sum + gif.fileSize, 0) / (1024 * 1024)).toFixed(1)}MB
            </div>
            <div className="text-sm text-gray-600">Total Size</div>
          </div>
        </GlassCard>
      </div>

      {/* GIFs Grid */}
      {repo.gifs.length > 0 ? (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">GIFs in this Repository</h2>
            <Link href="/dashboard/upload">
              <Button className="text-sm px-4 py-2">
                ➕ Add More GIFs
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repo.gifs.map(gif => (
              <div key={gif.id} className="bg-white/50 border border-gray-200/50 p-4">
                <div className="aspect-video bg-gray-200 mb-3 flex items-center justify-center">
                  <img 
                    src={gif.filename} 
                    alt={gif.originalName}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="text-4xl">🎬</div><div class="text-sm text-gray-600">GIF Preview</div>'
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium truncate" title={gif.originalName}>
                    {gif.originalName}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>📏 {gif.width}×{gif.height}</div>
                    <div>⏱️ {gif.duration.toFixed(1)}s</div>
                    <div>💾 {(gif.fileSize / (1024 * 1024)).toFixed(1)}MB</div>
                    <div>📥 {gif.downloads}</div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(gif.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <a 
                      href={gif.filename} 
                      download={gif.originalName}
                      className="flex-1"
                    >
                      <Button variant="secondary" className="w-full text-xs py-2">
                        💾 Download
                      </Button>
                    </a>
                    <Button 
                      variant="secondary" 
                      className="text-xs py-2 px-3 hover:bg-red-100 hover:text-red-600"
                      onClick={() => deleteGif(gif.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-12 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-semibold mb-2">No GIFs yet</h2>
          <p className="text-gray-600 mb-6">
            Upload videos and convert them to GIFs to populate this repository
          </p>
          <Link href="/dashboard/upload">
            <Button className="text-lg px-8 py-4">
              📹 Upload Your First Video
            </Button>
          </Link>
        </GlassCard>
      )}
    </div>
  )
}
