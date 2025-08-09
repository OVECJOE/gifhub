import { NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'

export async function POST() {
  try {
    await signOut({ redirect: false })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}


