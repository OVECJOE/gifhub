import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore GIFs - Discover Amazing Animated Content | GifHub',
  description: 'Browse thousands of high-quality GIFs from creators worldwide. Find animated content for memes, reactions, tutorials, and more. Download GIFs instantly.',
  keywords: 'GIFs, animated images, memes, reactions, download GIFs, animated content, gif repository',
  openGraph: {
    title: 'Explore GIFs - Discover Amazing Animated Content | GifHub',
    description: 'Browse thousands of high-quality GIFs from creators worldwide. Find animated content for memes, reactions, tutorials, and more.',
    type: 'website',
  },
}

type Repository = {
  id: string
  name: string
  description?: string
  views: number
  tags: Array<{ name: string }>
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
  user: { name: string; email: string }
}

async function getPublicRepos(q?: string, tag?: string): Promise<Repository[]> {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (tag) params.set('tag', tag)
  const url = `${process.env.NEXTAUTH_URL || ''}${params.toString() ? `/api/public/search?${params.toString()}` : '/api/public/repositories'}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return (data.repositories || []) as Repository[]
}

export default async function ExplorePage({ searchParams }: { searchParams?: Promise<{ q?: string; tag?: string }> }) {
  const params = await searchParams || { q: '', tag: '' }
  const repos = await getPublicRepos(params.q, params.tag)
  
  // Get featured repositories (top by views) for hero section
  const featuredRepos = repos.slice(0, 6)
  const allRepos = repos

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Discover Amazing GIFs
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8">
          Browse thousands of high-quality animated GIFs created by our community. 
          Find the perfect GIF for your memes, reactions, presentations, and more.
        </p>
        
        {/* Search Section */}
        <GlassCard className="p-6">
          <form className="flex flex-col sm:flex-row gap-3" action="/explore" method="get">
            <input
              name="q"
              defaultValue={params.q || ''}
              placeholder="Search GIFs, repositories..."
              className="border border-gray-300 px-4 py-3 bg-white/90 flex-1 w-full text-lg"
            />
            <input
              name="tag"
              defaultValue={params.tag || ''}
              placeholder="Tag filter"
              className="border border-gray-300 px-4 py-3 bg-white/90 w-full sm:w-48 text-lg"
            />
            <Button type="submit" className="w-full sm:w-auto">
              🔍 Search
            </Button>
          </form>
        </GlassCard>
      </section>

      {/* Stats Section */}
      {!params.q && !params.tag && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <GlassCard className="p-4">
            <div className="text-2xl md:text-3xl font-bold">{repos.length}</div>
            <div className="text-sm md:text-base text-gray-600">Public Repositories</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl md:text-3xl font-bold">
              {repos.reduce((acc, repo) => acc + (repo.gifs?.length || 0), 0)}
            </div>
            <div className="text-sm md:text-base text-gray-600">Total GIFs</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl md:text-3xl font-bold">
              {repos.reduce((acc, repo) => acc + (repo.views || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm md:text-base text-gray-600">Total Views</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl md:text-3xl font-bold">
              {repos.reduce((acc, repo) => acc + (repo.gifs?.reduce((sum, gif) => sum + (gif?.downloads || 0), 0) || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm md:text-base text-gray-600">Downloads</div>
          </GlassCard>
        </section>
      )}

      {/* Featured GIFs Preview - Show only if no search */}
      {!params.q && !params.tag && featuredRepos.length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">🔥 Trending GIFs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredRepos.slice(0, 6).map(repo => {
              const previewGif = repo.gifs?.[0]
              if (!previewGif) return null
              return (
                <Link key={repo.id} href={`/repository/${repo.id}`}>
                  <GlassCard className="p-0 hover:bg-white/90 transition-all duration-300 hover:scale-105 cursor-pointer group">
                    <div className="aspect-square bg-white/60 overflow-hidden flex items-center justify-center">
                      <img
                        src={previewGif.filename}
                        alt={previewGif.originalName || 'GIF preview'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-sm truncate" title={repo.name}>
                        {repo.name}
                      </div>
                      <div className="text-xs text-gray-600 flex justify-between mt-1">
                        <span>👀 {(repo.views || 0).toLocaleString()}</span>
                        <span>🎬 {repo.gifs?.length || 0}</span>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Search Results or All Repositories */}
      <section>
        {params.q || params.tag ? (
          <h2 className="text-xl md:text-2xl font-bold mb-6">
            Search Results {params.q && `for "${params.q}"`} {params.tag && `tagged "${params.tag}"`}
            <span className="text-gray-500 font-normal ml-2">({allRepos.length} found)</span>
          </h2>
        ) : (
          <h2 className="text-xl md:text-2xl font-bold mb-6">All Public Repositories</h2>
        )}
        
        {allRepos.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No repositories found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or browse our featured content above.
            </p>
            <Link href="/explore">
              <Button>View All Repositories</Button>
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allRepos.map(repo => (
              <GlassCard key={repo.id} className="p-0 hover:bg-white/90 transition-colors group">
                {/* Repository Preview */}
                <div className="aspect-video bg-white/60 overflow-hidden flex items-center justify-center relative">
                  {repo.gifs && repo.gifs.length > 0 ? (
                    <img
                      src={repo.gifs[0]?.filename}
                      alt={repo.gifs[0]?.originalName || 'GIF preview'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-4xl text-gray-400">🎬</div>
                  )}
                  {/* Overlay with GIF count */}
                  {repo.gifs && repo.gifs.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1">
                      +{repo.gifs.length - 1} more
                    </div>
                  )}
                </div>

                {/* Repository Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <Link href={`/repository/${repo.id}`}>
                      <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors truncate" title={repo.name}>
                        {repo.name}
                      </h3>
                    </Link>
                    {repo.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="text-center">
                      <div className="font-medium">👀 {(repo.views || 0).toLocaleString()}</div>
                      <div>Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">🎬 {repo.gifs?.length || 0}</div>
                      <div>GIFs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">
                        📥 {repo.gifs?.reduce((sum, gif) => sum + (gif?.downloads || 0), 0) || 0}
                      </div>
                      <div>Downloads</div>
                    </div>
                  </div>

                  {/* Tags */}
                  {repo.tags && repo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {repo.tags.filter(tag => tag && tag.name).slice(0, 3).map((tag, index) => (
                        <Link
                          key={index}
                          href={`/explore?tag=${encodeURIComponent(tag.name)}`}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs border border-gray-200 transition-colors"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                      {repo.tags.filter(tag => tag && tag.name).length > 3 && (
                        <span className="px-2 py-1 text-gray-600 text-xs">
                          +{repo.tags.filter(tag => tag && tag.name).length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Author */}
                  <div className="text-xs text-gray-500 flex items-center justify-between">
                    <span>👤 by {repo.user?.name || repo.user?.email || 'Unknown'}</span>
                    <Link href={`/repository/${repo.id}`}>
                      <Button variant="secondary" className="text-xs py-1 px-3">
                        View →
                      </Button>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action */}
      {!params.q && !params.tag && (
        <section className="text-center py-8">
          <GlassCard className="p-8">
            <h3 className="text-xl md:text-2xl font-bold mb-2">Ready to Create Your Own?</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our community of creators! Upload your videos and convert them to high-quality GIFs 
              that can be discovered by thousands of users.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/upload">
                <Button className="w-full sm:w-auto">🚀 Start Creating</Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" className="w-full sm:w-auto">📝 Sign Up Free</Button>
              </Link>
            </div>
          </GlassCard>
        </section>
      )}
    </div>
  )
}
