import { getServerSession, type NextAuthOptions } from 'next-auth'
import { authConfig } from '@/app/lib/auth'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authConfig as unknown as NextAuthOptions)
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
      {!session?.user ? (
        <p className="mt-4">Please <Link className="underline" href="/login">login</Link>.</p>
      ) : (
        <p className="mt-4">Welcome, {session.user.name || session.user.email}</p>
      )}
    </div>
  )
}


