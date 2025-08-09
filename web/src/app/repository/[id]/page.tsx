import { notFound } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'

async function getRepo(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/public/repositories/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return (await res.json()).repository as { 
    id: string
    name: string
    description?: string
    gifs: Array<{ 
      id: string
      filename: string
      originalName: string
      downloads: number
      width: number
      height: number
      duration: number
      fileSize: number
    }>
    views: number
    user: { name: string; email: string }
    tags: Array<{ name: string }>
  }
}

async function incrementView(id: string) {
  await fetch(`${process.env.NEXTAUTH_URL || ''}/api/repositories/${id}/view`, { method: 'POST' })
}

export default async function PublicRepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = await getRepo(id)
  if (!repo) return notFound()
  await incrementView(id)

  async function rate(formData: FormData) {
    'use server'
    const rating = Number(formData.get('rating') || 0)
    await fetch(`${process.env.NEXTAUTH_URL || ''}/api/repositories/${id}/rate`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ rating }) 
    })
  }

  return (
    <div className="space-y-8">
      {/* Repository Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">{repo.name}</h1>
        {repo.description && (
          <p className="text-lg text-gray-700 mb-3">{repo.description}</p>
        )}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <span>👤 by {repo.user.name || repo.user.email}</span>
          <span>👀 {repo.views.toLocaleString()} views</span>
          <span>🎬 {repo.gifs.length} GIFs</span>
        </div>
        
        {/* Tags */}
        {repo.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {repo.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
      <GlassCard className="p-6 max-w-md mx-auto">
        <form action={rate} className="flex items-center justify-center gap-3">
          <label className="font-medium">Rate this repository:</label>
          <select name="rating" className="border border-gray-300 px-3 py-2 bg-white/80">
            <option value="">Select</option>
            {[1,2,3,4,5].map(n => (
              <option key={n} value={n}>{'⭐'.repeat(n)} {n}</option>
            ))}
          </select>
          <Button type="submit" className="px-4 py-2">Submit</Button>
        </form>
      </GlassCard>

      {/* GIFs Grid */}
      {repo.gifs.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-6 text-center">GIFs in this Repository</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repo.gifs.map(gif => (
              <GlassCard key={gif.id} className="p-4">
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
                  
                  <div className="flex gap-2 mt-3">
                    <a 
                      href={gif.filename} 
                      download={gif.originalName}
                      className="flex-1"
                    >
                      <Button variant="secondary" className="w-full text-sm py-2">
                        💾 Download
                      </Button>
                    </a>
                    <form 
                      action={async () => {
                        'use server'
                        await fetch(`${process.env.NEXTAUTH_URL || ''}/api/gifs/${gif.id}/download`, { method: 'POST' })
                      }}
                      className="flex-1"
                    >
                      <Button type="submit" variant="secondary" className="w-full text-sm py-2">
                        📊 Track
                      </Button>
                    </form>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      ) : (
        <GlassCard className="p-12 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-semibold mb-2">No GIFs yet</h2>
          <p className="text-gray-600">This repository is empty</p>
        </GlassCard>
      )}
    </div>
  )
}
