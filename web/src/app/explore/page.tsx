async function getPublicRepos() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/repositories/public`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return data.repositories as Array<{ id: string; name: string; views: number }>
}

export default async function ExplorePage() {
  const repos = await getPublicRepos()
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Explore Public Repositories</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {repos.map(r => (
          <div key={r.id} className="bg-white/70 border border-gray-200 p-4">
            <div className="text-xl font-semibold">{r.name}</div>
            <div className="text-gray-700">Views: {r.views}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


