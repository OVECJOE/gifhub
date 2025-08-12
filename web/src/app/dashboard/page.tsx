'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'

type Repository = { id: string; name: string; views: number; gifs: { id: string }[] }
type PublicActivity = {
  id: string
  type: 'repository_created' | 'gif_uploaded'
  user: { name: string; email: string }
  repository: { id: string; name: string; description?: string }
  createdAt: string
}
type RecentGif = {
  id: string
  filename: string
  originalName: string
  repository: { id: string; name: string }
  createdAt: string
}
type TrendingRepo = {
  id: string
  name: string
  description?: string
  views: number
  user: { name: string }
  gifs: { id: string }[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Independent loading states for each section
  const [repos, setRepos] = useState<Repository[]>([])
  const [recentGifs, setRecentGifs] = useState<RecentGif[]>([])
  const [publicActivities, setPublicActivities] = useState<PublicActivity[]>([])
  const [trendingRepos, setTrendingRepos] = useState<TrendingRepo[]>([])
  
  const [loadingStates, setLoadingStates] = useState({
    repos: true,
    recentGifs: true,
    activities: true,
    trending: true
  })

  // Load user repositories
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/repositories')
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          setRepos(data.repositories || [])
          setLoadingStates(prev => ({ ...prev, repos: false }))
        })
        .catch(() => {
          setRepos([])
          setLoadingStates(prev => ({ ...prev, repos: false }))
        })
    }
  }, [status])

  // Load recent GIFs
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/gifs?recent=5')
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          setRecentGifs(data.gifs || [])
          setLoadingStates(prev => ({ ...prev, recentGifs: false }))
        })
        .catch(() => {
          setRecentGifs([])
          setLoadingStates(prev => ({ ...prev, recentGifs: false }))
        })
    }
  }, [status])

  // Load public activities
  useEffect(() => {
    fetch('/api/public/activities?limit=10')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setPublicActivities(data.activities || [])
        setLoadingStates(prev => ({ ...prev, activities: false }))
      })
      .catch(() => {
        setPublicActivities([])
        setLoadingStates(prev => ({ ...prev, activities: false }))
      })
  }, [])

  // Load trending repositories
  useEffect(() => {
    fetch('/api/repositories/public?trending=true&limit=5')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setTrendingRepos(data.repositories || [])
        setLoadingStates(prev => ({ ...prev, trending: false }))
      })
      .catch(() => {
        setTrendingRepos([])
        setLoadingStates(prev => ({ ...prev, trending: false }))
      })
  }, [])

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200/50 animate-pulse"></div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
  }

  const totalViews = repos.reduce((s, r) => s + (r.views || 0), 0)
  const totalGifs = repos.reduce((s, r) => s + (r.gifs?.length || 0), 0)

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="bg-white/40 backdrop-blur-sm border border-gray-200/50 p-4">
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/upload">
            <Button className="text-base px-4 py-2">
              📹 Upload Video
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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-4xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-600">Welcome back, {session?.user?.name || session?.user?.email}</p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Repositories</div>
              <div className="text-2xl font-bold">
                {loadingStates.repos ? (
                  <div className="h-8 w-12 bg-gray-200 animate-pulse"></div>
                ) : repos.length}
              </div>
            </div>
            <div className="text-2xl">📁</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total GIFs</div>
              <div className="text-2xl font-bold">
                {loadingStates.repos ? (
                  <div className="h-8 w-12 bg-gray-200 animate-pulse"></div>
                ) : totalGifs}
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
                {loadingStates.repos ? (
                  <div className="h-8 w-12 bg-gray-200 animate-pulse"></div>
                ) : totalViews.toLocaleString()}
              </div>
            </div>
            <div className="text-2xl">👀</div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Avg Views/Repo</div>
              <div className="text-2xl font-bold">
                {loadingStates.repos ? (
                  <div className="h-8 w-12 bg-gray-200 animate-pulse"></div>
                ) : repos.length > 0 ? Math.round(totalViews / repos.length) : 0}
              </div>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </GlassCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent GIFs */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent GIFs</h2>
            <Link href="/dashboard/gifs" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          
          {loadingStates.recentGifs ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 animate-pulse w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentGifs.length > 0 ? (
            <div className="space-y-3">
              {recentGifs.map(gif => (
                <div key={gif.id} className="flex items-center gap-3 p-2 hover:bg-white/20 transition-colors">
                  <div className="w-12 h-12 bg-gray-300 flex items-center justify-center text-xl">
                    🎬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{gif.originalName}</div>
                    <div className="text-sm text-gray-600 truncate">{gif.repository.name}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📹</div>
              <p>No GIFs yet</p>
              <Link href="/dashboard/upload" className="text-blue-600 hover:underline">Upload your first video</Link>
            </div>
          )}
        </GlassCard>

        {/* Public Activities Feed */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Community Activity</h2>
            <Link href="/explore" className="text-sm text-blue-600 hover:underline">Explore</Link>
          </div>
          
          {loadingStates.activities ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-200 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 animate-pulse w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : publicActivities.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {publicActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="text-lg mt-0.5">
                    {activity.type === 'repository_created' ? '📁' : '🎬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800">
                      <span className="font-medium">{activity.user.name || activity.user.email}</span>
                      {activity.type === 'repository_created' ? ' created repository ' : ' uploaded GIF to '}
                      <Link 
                        href={`/repository/${activity.repository.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {activity.repository.name}
                      </Link>
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🌍</div>
              <p>No recent activity</p>
            </div>
          )}
        </GlassCard>

        {/* Trending Repositories */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Trending</h2>
            <Link href="/explore" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          
          {loadingStates.trending ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-b border-gray-200/30 pb-3">
                  <div className="h-4 bg-gray-200 animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 animate-pulse w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 animate-pulse w-1/2"></div>
                </div>
              ))}
            </div>
          ) : trendingRepos.length > 0 ? (
            <div className="space-y-4">
              {trendingRepos.map((repo, index) => (
                <div key={repo.id} className="border-b border-gray-200/30 pb-3 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                        <Link 
                          href={`/repository/${repo.id}`}
                          className="font-medium text-blue-600 hover:underline truncate"
                        >
                          {repo.name}
                        </Link>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">by {repo.user.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>👀 {repo.views}</span>
                        <span>🎬 {repo.gifs.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🔥</div>
              <p>No trending repos yet</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
