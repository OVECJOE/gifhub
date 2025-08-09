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
  tags: Array<{ id: string; name: string }>
}

type Tag = { id: string; name: string }

export default function EditRepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { status } = useSession()
  const [repo, setRepo] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTags, setSavingTags] = useState(false)
  const [saved, setSaved] = useState(false)
  const [id, setId] = useState<string>('')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchRepository()
      fetchAvailableTags()
    } else if (status === 'unauthenticated') {
      redirect('/login')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id])

  useEffect(() => {
    if (repo) {
      setName(repo.name)
      setDescription(repo.description || '')
      setIsPublic(repo.isPublic)
      setSelectedTags(repo.tags.map(t => t.id))
    }
  }, [repo])

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

  const fetchAvailableTags = async () => {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) {
        const data = await res.json()
        setAvailableTags(data.tags || [])
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const saveRepository = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/repositories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isPublic
        })
      })
      
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to update repository:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveTags = async () => {
    setSavingTags(true)
    try {
      const tagNames = selectedTags.map(tagId => 
        availableTags.find(t => t.id === tagId)?.name
      ).filter(Boolean)
      
      const res = await fetch(`/api/repositories/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: tagNames })
      })
      
      if (res.ok) {
        // Refresh repository data
        fetchRepository()
      }
    } catch (error) {
      console.error('Failed to update tags:', error)
    } finally {
      setSavingTags(false)
    }
  }

  const createTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() })
      })
      
      if (res.ok) {
        const data = await res.json()
        setAvailableTags(prev => [...prev, data.tag])
        setSelectedTags(prev => [...prev, data.tag.id])
        setNewTagName('')
      }
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
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
          <Link href={`/dashboard/repositories/${id}`}>
            <Button variant="secondary" className="text-base px-4 py-2">
              ← Back to Repository
            </Button>
          </Link>
          <Link href="/dashboard/repositories">
            <Button variant="secondary" className="text-base px-4 py-2">
              📁 All Repositories
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold">Edit Repository</h1>
        <p className="text-gray-600 mt-1">Update repository details and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Repository Details</h2>
            
            <form onSubmit={saveRepository} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Repository Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 bg-white/80 text-lg"
                  placeholder="My Awesome GIFs"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 bg-white/80 text-lg h-24 resize-none"
                  placeholder="A collection of my favorite moments..."
                />
              </div>

              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-lg">
                    <span className="font-medium">Make this repository public</span>
                    <div className="text-sm text-gray-600">
                      Public repositories can be viewed and discovered by anyone
                    </div>
                  </span>
                </label>
              </div>

              {saved && (
                <div className="p-4 bg-green-100 border border-green-300 text-green-800">
                  ✅ Repository updated successfully!
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
        </div>

        {/* Tags Sidebar */}
        <div>
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tags</h2>
            
            <div className="space-y-4">
              {/* Current Tags */}
              <div>
                <div className="text-sm font-medium mb-2">Current Tags</div>
                <div className="flex flex-wrap gap-2">
                  {repo.tags.map(tag => (
                    <span 
                      key={tag.id}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {repo.tags.length === 0 && (
                    <span className="text-gray-500 text-sm">No tags yet</span>
                  )}
                </div>
              </div>

              {/* Available Tags */}
              <div>
                <div className="text-sm font-medium mb-2">Available Tags</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableTags.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Create New Tag */}
              <div>
                <div className="text-sm font-medium mb-2">Create New Tag</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 border border-gray-300 px-3 py-2 bg-white/80 text-sm"
                    placeholder="Tag name"
                  />
                  <Button 
                    type="button"
                    onClick={createTag}
                    disabled={!newTagName.trim()}
                    className="text-sm px-3 py-2"
                  >
                    ➕
                  </Button>
                </div>
              </div>

              <Button 
                onClick={saveTags}
                disabled={savingTags}
                className="w-full text-sm py-2"
              >
                {savingTags ? '🏷️ Saving...' : '🏷️ Update Tags'}
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
