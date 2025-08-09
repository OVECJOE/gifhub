import { NextResponse } from 'next/server'
import { z } from 'zod'
import { signIn } from '@/app/lib/auth'

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { email, password } = parsed.data
    await signIn('credentials', { email, password, redirect: false })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}


