'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { signIn } from 'next-auth/react'
import { Separator } from '@/components/ui/Separator'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Schema = z.object({ email: z.email(), password: z.string().min(1) })
type FormValues = z.infer<typeof Schema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(Schema) })
  const router = useRouter()

  const onSubmit = async (values: FormValues) => {
    setError(null)
    const res = await signIn('credentials', { redirect: false, ...values })
    if (res?.error) setError('Invalid credentials')
    if (res?.ok) router.push('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto">
      <GlassCard>
        <div className='flex flex-col gap-1 mb-6'>
          <h1 className="text-2xl md:text-3xl font-bold">Login</h1>
          <p className='text-sm text-gray-500'>
            Don&apos;t have an account? <Link href="/register" className="text-black underline">Register</Link>
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className="w-full border border-gray-300 px-4 py-3 bg-white/80" placeholder="Email" type="email" {...register('email')} />
          <input className="w-full border border-gray-300 px-4 py-3 bg-white/80" placeholder="Password" type="password" {...register('password')} />
          {error && <p className="text-red-600">{error}</p>}
          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={isSubmitting}>Login</Button>
            <Separator />
            <Button type="button" variant="secondary" onClick={() => signIn('google', { redirectTo: '/dashboard' })}>Login with Google</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
