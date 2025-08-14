'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return null
  }

  return <div className="max-w-4xl mx-auto w-full">{children}</div>
}
