'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
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
  }
}

export default function DashboardGifsPage() {
  const { status } = useSession()
  const [gifs, setGifs] = useState<Gif[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGifs()
    } else if (status === 'unauthenticated') {
      redirect('/login')
    }
  }, [status])

  const fetchGifs = async () => {
    try {
      const res = await fetch('/api/gifs?recent=1000') // Get all gifs
      if (res.ok) {
        const data = await res.json()
        setGifs(data.gifs || [])
      }
    } catch (error) {
      console.error('Failed to fetch GIFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteGif = async (gifId: string) => {
    if (!confirm('Are you sure you want to delete this GIF? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/gifs/${gifId}`, { method: 'DELETE' })
      if (res.ok) {
        setGifs(prev => prev.filter(gif => gif.id !== gifId))
      }
    } catch (error) {
      console.error('Failed to delete GIF:', error)
      alert('Failed to delete GIF. Please try again.')
    }
  }

  const filteredAndSortedGifs = gifs
    .filter(gif => 
      gif.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gif.repository.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name':
          return a.originalName.localeCompare(b.originalName)
        case 'size':
          return b.fileSize - a.fileSize
        default:
          return 0
      }
    })

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200/50 animate-pulse"></div>
        <h1 className="text-2xl md:text-4xl font-bold">My GIFs</h1>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold">My GIFs</h1>
          <p className="text-gray-600 mt-1">
            {gifs.length} GIF{gifs.length !== 1 ? 's' : ''} across all repositories
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="text-lg px-6 py-3">
            📹 Create New GIF
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search GIFs</label>
            <input
              type="text"
              placeholder="Search by name or repository..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 p-3 bg-white/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name' | 'size')}
              className="w-full border border-gray-300 p-3 bg-white/80"
            >
              <option value="newest">🕒 Newest First</option>
              <option value="oldest">🕒 Oldest First</option>
              <option value="name">📝 Name A-Z</option>
              <option value="size">💾 Size (Largest)</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* GIFs Grid */}
      {filteredAndSortedGifs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAndSortedGifs.map(gif => (
            <GlassCard key={gif.id} className="p-0 hover:bg-white/80 transition-colors">
              <div className="aspect-video bg-white/60 border border-gray-200 overflow-hidden flex items-center justify-center">
                <img 
                  src={gif.filename} 
                  alt={gif.originalName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    const parent = (e.target as HTMLImageElement).parentElement
                    if (parent) {
                      parent.innerHTML = '<div class="text-4xl">🎬</div><div class="text-sm text-gray-600">GIF Preview</div>'
                    }
                  }}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-medium truncate" title={gif.originalName}>
                    {gif.originalName}
                  </h3>
                  <Link 
                    href={`/dashboard/repositories/${gif.repository.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    📁 {gif.repository.name}
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>📏 {gif.width}×{gif.height}</div>
                  <div>⏱️ {formatDuration(gif.duration)}</div>
                  <div>💾 {formatFileSize(gif.fileSize)}</div>
                  <div>📥 {gif.downloads}</div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {new Date(gif.createdAt).toLocaleDateString()}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    className="flex-1 text-sm py-2"
                    onClick={() => downloadFile(gif.filename, `${gif.id}.gif`)}
                  >
                    💾 <span className="hidden lg:inline">Download</span>
                  </Button>
                  <Link href={`/dashboard/gifs/${gif.id}`}>
                    <Button variant="secondary" className="text-sm py-2 w-full h-full">
                      👁️
                    </Button>
                  </Link>
                  <Button 
                    variant="secondary" 
                    className="text-sm py-2"
                    onClick={() => deleteGif(gif.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-12 text-center">
          {searchTerm ? (
            <>
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-2xl font-semibold mb-2">No GIFs found</h2>
              <p className="text-gray-600 mb-4">Try adjusting your search terms</p>
              <Button variant="secondary" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-2xl font-semibold mb-2">No GIFs yet</h2>
              <p className="text-gray-600 mb-6">
                Start creating GIFs by uploading videos
              </p>
              <Link href="/dashboard/upload">
                <Button className="text-lg px-8 py-4">
                  📹 Create Your First GIF
                </Button>
              </Link>
            </>
          )}
        </GlassCard>
      )}
    </div>
  )
}
