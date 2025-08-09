'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'

type Repository = {
  id: string
  name: string
  description?: string
  isPublic: boolean
  views: number
  gifs: { id: string }[]
  createdAt: string
  updatedAt: string
}

export default function RepositoriesPage() {
  const { status } = useSession()
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRepositories()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const fetchRepositories = async () => {
    try {
      const res = await fetch('/api/repositories')
      if (res.ok) {
        const data = await res.json()
        setRepos(data.repositories || [])
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
    } finally {
      setLoading(false)
    }
  }



  const deleteRepository = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repository? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/repositories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRepos(prev => prev.filter(repo => repo.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete repository:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-4xl font-bold">My Repositories</h1>
          <div className="h-10 w-32 bg-gray-200 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/login')
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
          <Link href="/dashboard/profile">
            <Button variant="secondary" className="text-base px-4 py-2">
              👤 Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold">My Repositories</h1>
          <p className="text-gray-600 mt-1">Organize your GIFs into collections</p>
        </div>
        <Link href="/dashboard/repositories/new">
          <Button className="text-base px-6 py-3">
            ➕ New Repository
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Repositories</div>
              <div className="text-2xl font-bold">{repos.length}</div>
            </div>
            <div className="text-2xl">📁</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total GIFs</div>
              <div className="text-2xl font-bold">
                {repos.reduce((sum, repo) => sum + repo.gifs.length, 0)}
              </div>
            </div>
            <div className="text-2xl">🎬</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Views</div>
              <div className="text-2xl font-bold">
                {repos.reduce((sum, repo) => sum + repo.views, 0).toLocaleString()}
              </div>
            </div>
            <div className="text-2xl">👀</div>
          </div>
        </GlassCard>
      </div>



      {/* Repositories Grid */}
      {repos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map(repo => (
            <GlassCard key={repo.id} className="p-6 hover:bg-white/80 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold truncate">{repo.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium ${
                      repo.isPublic 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {repo.isPublic ? '🌍 Public' : '🔒 Private'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  <Link href={`/dashboard/repositories/${repo.id}/edit`}>
                    <Button variant="secondary" className="text-xs px-2 py-1">
                      ✏️
                    </Button>
                  </Link>
                  <Button 
                    variant="secondary" 
                    className="text-xs px-2 py-1 hover:bg-red-100 hover:text-red-600"
                    onClick={() => deleteRepository(repo.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>

              {repo.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{repo.description}</p>
              )}

              <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
                <div>
                  <div className="font-semibold">{repo.gifs.length}</div>
                  <div className="text-gray-600">GIFs</div>
                </div>
                <div>
                  <div className="font-semibold">{repo.views}</div>
                  <div className="text-gray-600">Views</div>
                </div>
                <div>
                  <div className="font-semibold">
                    {new Date(repo.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="text-gray-600">Updated</div>
                </div>
              </div>

              <Link href={`/dashboard/repositories/${repo.id}`}>
                <Button variant="secondary" className="text-xs w-full mt-4">
                  👀 View
                </Button>
              </Link>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h2 className="text-2xl font-semibold mb-2">No repositories yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first repository to start organizing your GIFs
          </p>
          <Link href="/dashboard/repositories/new">
            <Button className="text-lg px-8 py-4">
              ➕ Create Your First Repository
            </Button>
          </Link>
        </GlassCard>
      )}
    </div>
  )
}
