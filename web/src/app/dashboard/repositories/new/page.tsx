'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'

export default function NewRepositoryPage() {
  const { status } = useSession()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [creating, setCreating] = useState(false)

  if (status === 'unauthenticated') {
    router.push('/login')
  }

  const createRepository = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isPublic
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/repositories/${data.repository.id}`)
      }
    } catch (error) {
      console.error('Failed to create repository:', error)
    } finally {
      setCreating(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-4xl font-bold">Create New Repository</h1>
        <div className="h-64 bg-gray-200 animate-pulse"></div>
      </div>
    )
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
          <Link href="/dashboard">
            <Button variant="secondary" className="text-base px-4 py-2">
              🏠 Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold">Create New Repository</h1>
        <p className="text-gray-600 mt-1">Organize your GIFs into a new collection</p>
      </div>

      {/* Create Form */}
      <div className="max-w-2xl">
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-2xl font-semibold mb-2">New Repository</h2>
            <p className="text-gray-600">
              Create a repository to organize and share your GIFs
            </p>
          </div>

          <form onSubmit={createRepository} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Repository Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 bg-white/80 text-lg"
                placeholder="My Awesome GIFs"
                required
                disabled={creating}
              />
              <p className="text-sm text-gray-600 mt-1">
                Choose a descriptive name for your repository
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 bg-white/80 text-lg h-24 resize-none"
                placeholder="A collection of my favorite moments, funny clips, and memorable scenes..."
                disabled={creating}
              />
              <p className="text-sm text-gray-600 mt-1">
                Optional: Describe what kind of GIFs you&apos;ll store here
              </p>
            </div>

            <div className="bg-gray-50/80 border border-gray-200/50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 mt-1"
                  disabled={creating}
                />
                <div>
                  <div className="font-medium text-lg">
                    🌍 Make this repository public
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Public repositories can be viewed and discovered by anyone on GifHub. 
                    You can change this setting later.
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {isPublic ? (
                      <>✅ This repository will be visible to everyone</>
                    ) : (
                      <>🔒 This repository will be private to you</>
                    )}
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={creating || !name.trim()}
                className="text-lg px-8 py-4"
              >
                {creating ? '📁 Creating Repository...' : '📁 Create Repository'}
              </Button>
              
              <Link href="/dashboard/repositories">
                <Button 
                  type="button" 
                  variant="secondary"
                  className="text-lg px-8 py-4"
                  disabled={creating}
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>

          {/* Quick Tips */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <h3 className="font-medium mb-3">💡 Quick Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use descriptive names like &quot;Funny Cats&quot; or &quot;Movie Clips&quot;</li>
              <li>• Public repositories help others discover your content</li>
              <li>• You can add tags later to help organize and search</li>
              <li>• Upload videos to this repository from the Upload page</li>
            </ul>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
