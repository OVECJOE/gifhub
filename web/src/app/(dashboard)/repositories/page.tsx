import Link from 'next/link'

async function getRepos() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/repositories`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return data.repositories as Array<{ id: string; name: string; isPublic: boolean }>
}

export default async function RepositoriesPage() {
  const repos = await getRepos()
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Your Repositories</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {repos.map(r => (
          <Link key={r.id} href={`/repository/${r.id}`} className="bg-white/70 border border-gray-200 p-4">
            <div className="text-xl font-semibold">{r.name}</div>
            <div className="text-gray-700">{r.isPublic ? 'Public' : 'Private'}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}


