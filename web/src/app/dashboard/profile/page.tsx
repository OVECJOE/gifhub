'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'

type UserStats = {
  repositories: number
  gifs: number
  totalViews: number
  totalDownloads: number
  publicRepositories: number
  joinDate: string
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session?.user?.name])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserStats()
    }
  }, [status])

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/profile/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })
      
      if (res.ok) {
        await update()
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loadingStats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-4xl font-bold">Profile Settings</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-200 animate-pulse"></div>
          <div className="lg:col-span-2 h-64 bg-gray-200 animate-pulse"></div>
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
          <Link href="/dashboard/repositories">
            <Button variant="secondary" className="text-base px-4 py-2">
              📁 My Repositories
            </Button>
          </Link>
          <Link href="/dashboard/upload">
            <Button variant="secondary" className="text-base px-4 py-2">
              📹 Upload Video
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">👤 Account Information</h2>
            
            <form onSubmit={saveProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 bg-white/80 text-lg"
                  placeholder="Your display name"
                />
                <p className="text-sm text-gray-600 mt-1">
                  This name will be shown on your public repositories
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="w-full border border-gray-300 px-4 py-3 bg-gray-100/80 text-lg text-gray-600">
                  {session?.user?.email}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Email cannot be changed at this time
                </p>
              </div>

              {saved && (
                <div className="p-4 bg-green-100 border border-green-300 text-green-800">
                  ✅ Profile updated successfully!
                </div>
              )}

              <Button 
                type="submit" 
                disabled={saving || !name.trim()}
                className="text-lg px-8 py-3"
              >
                {saving ? '💾 Saving...' : '💾 Save Changes'}
              </Button>
            </form>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">🔒 Account Security</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🛡️</span>
                  <span className="font-medium">Account Secured</span>
                </div>
                <p className="text-sm">
                  Your account is protected with NextAuth.js authentication
                </p>
              </div>

              <div className="text-sm text-gray-600">
                <p>• Password management is handled securely</p>
                <p>• OAuth integration available</p>
                <p>• Session tokens are encrypted</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Your Stats</h2>
            
            {stats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Repositories</span>
                  <span className="font-bold text-lg">{stats.repositories}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total GIFs</span>
                  <span className="font-bold text-lg">{stats.gifs}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-bold text-lg">{stats.totalViews.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Downloads</span>
                  <span className="font-bold text-lg">{stats.totalDownloads.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Public Repos</span>
                  <span className="font-bold text-lg">{stats.publicRepositories}</span>
                </div>
                
                <hr className="border-gray-200/50" />
                
                <div className="text-center">
                  <div className="text-sm text-gray-600">Member since</div>
                  <div className="font-medium">
                    {new Date(stats.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 animate-pulse w-20"></div>
                    <div className="h-4 bg-gray-200 animate-pulse w-8"></div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">🚀 Quick Actions</h2>
            
            <div className="space-y-3">
              <Link href="/dashboard/upload" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  📹 Upload New Video
                </Button>
              </Link>
              
              <Link href="/dashboard/repositories" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  📁 Manage Repositories
                </Button>
              </Link>
              
              <Link href="/explore" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  🌍 Explore Public GIFs
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
