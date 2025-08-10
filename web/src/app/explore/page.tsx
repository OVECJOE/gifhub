async function getPublicRepos(q?: string, tag?: string) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (tag) params.set('tag', tag)
  const url = `${process.env.NEXTAUTH_URL || ''}${params.toString() ? `/api/public/search?${params.toString()}` : '/api/repositories/public'}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return (data.repositories || []) as Array<{ id: string; name: string; views: number; tags?: Array<{ name: string }> }>
}

export default async function ExplorePage({ searchParams }: { searchParams?: Promise<{ q?: string; tag?: string }> }) {
  const params = await searchParams || { q: '', tag: '' }
  const repos = await getPublicRepos(params.q, params.tag)
  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Explore Public Repositories</h1>
      <form className="flex flex-col sm:flex-row gap-3 mb-4" action="/explore" method="get">
        <input
          name="q"
          defaultValue={params.q || ''}
          placeholder="Search"
          className="border border-gray-300 px-3 py-2 bg-white/80 flex-1 w-full"
        />
        <input
          name="tag"
          defaultValue={params.tag || ''}
          placeholder="Tag"
          className="border border-gray-300 px-3 py-2 bg-white/80 w-full sm:w-48"
        />
        <button className="px-6 py-3 bg-black text-white w-full sm:w-auto">Search</button>
      </form>
      {repos.length === 0 && (
        <p className="text-gray-500 text-base md:text-xl border border-gray-200 p-4 mt-4">No public repositories found</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map(r => (
          <div key={r.id} className="bg-white/70 border border-gray-200 p-4 hover:bg-white/80 transition-colors break-words">
            <div className="text-lg md:text-xl font-semibold">{r.name}</div>
            <div className="text-gray-700 text-sm md:text-base">Views: {r.views}</div>
            {r.tags && r.tags.length > 0 && (
              <div className="text-xs md:text-sm text-gray-600 mt-1">Tags: {r.tags.map(t=>t.name).join(', ')}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


