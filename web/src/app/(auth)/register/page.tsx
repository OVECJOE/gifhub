'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GlassCard } from '@/app/components/ui/GlassCard'
import { Button } from '@/app/components/ui/Button'

const Schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})
type FormValues = z.infer<typeof Schema>

export default function RegisterPage() {
  const [message, setMessage] = useState<string | null>(null)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(Schema) })

  const onSubmit = async (values: FormValues) => {
    setMessage(null)
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    const data = await res.json()
    if (!res.ok) setMessage(data.error || 'Registration failed')
    else setMessage('Registration successful. You can now log in.')
  }

  return (
    <div className="max-w-md mx-auto">
      <GlassCard>
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Register</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className="w-full border border-gray-300 px-4 py-3 bg-white/80" placeholder="Name" {...register('name')} />
          <input className="w-full border border-gray-300 px-4 py-3 bg-white/80" placeholder="Email" type="email" {...register('email')} />
          <input className="w-full border border-gray-300 px-4 py-3 bg-white/80" placeholder="Password" type="password" {...register('password')} />
          {message && <p className="text-black">{message}</p>}
          <Button type="submit" disabled={isSubmitting}>Create account</Button>
        </form>
      </GlassCard>
    </div>
  )
}


