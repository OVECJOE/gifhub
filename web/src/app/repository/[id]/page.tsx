import { notFound } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

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

async function urlIsReachable(url: string): Promise<boolean> {
  try {
    const headResponse = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    if (headResponse.ok) return true
    if (headResponse.status === 405 || headResponse.status === 403) {
      const probeResponse = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        cache: 'no-store',
      })
      return probeResponse.ok
    }
    return false
  } catch {
    return false
  }
}

export default async function PublicRepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = await getRepo(id)
  if (!repo) return notFound()
  await incrementView(id)

  const gifsWithAvailability = await Promise.all(
    repo.gifs.map(async (gif) => ({ ...gif, available: await urlIsReachable(gif.filename) }))
  )

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
      {/* Repository Summary */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold mb-2">{repo.name}</h1>
            {repo.description && (
              <p className="text-base md:text-lg text-gray-700">{repo.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-4">
              <span>👤 by {repo.user.name || repo.user.email}</span>
              <span>👀 {repo.views.toLocaleString()} views</span>
              <span>🎬 {repo.gifs.length} GIFs</span>
            </div>
            {/* Tags */}
            {repo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {repo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-xs border border-gray-200"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Rating */}
          <div className="w-full md:w-72">
            <form action={rate} className="bg-gray-50/80 border border-gray-200/70 p-4 space-y-3">
              <label className="font-medium block">Rate this repository</label>
              <select name="rating" className="w-full border border-gray-300 px-3 py-2 bg-white/90">
                <option value="">Select</option>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{'⭐'.repeat(n)} {n}</option>
                ))}
              </select>
              <Button type="submit" className="w-full text-sm py-2">Submit</Button>
            </form>
          </div>
        </div>
      </GlassCard>

      {/* GIFs Grid */}
      {repo.gifs.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold">GIFs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gifsWithAvailability.map(gif => (
              <GlassCard key={gif.id} className="p-0 hover:bg-white/80 transition-colors">
                <div className="aspect-video bg-white/60 border border-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                  {gif.available ? (
                    <img
                      src={gif.filename}
                      alt={gif.originalName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="text-5xl mb-1">🎬</div>
                      <div className="text-sm">Preview not available</div>
                    </div>
                  )}
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
                  <div className="flex gap-2 pt-2">
                    <Link href={gif.filename} download={gif.originalName} className="flex-1">
                      <Button variant="secondary" className="w-full text-sm py-2">💾 Download</Button>
                    </Link>
                    <form
                      action={async () => {
                        'use server'
                        await fetch(`${process.env.NEXTAUTH_URL || ''}/api/gifs/${gif.id}/download`, { method: 'POST' })
                      }}
                    >
                      <Button type="submit" variant="secondary" className="text-sm py-2">📊 Track</Button>
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
