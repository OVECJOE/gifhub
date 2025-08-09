import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mailer'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || typeof email !== 'string') return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ ok: true })
  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + 1000 * 60 * 60)
  await prisma.verificationToken.create({ data: { identifier: `reset:${email}`, token, expires } })
  const link = `reset-password?token=${encodeURIComponent(token)}`
  await sendEmail(email, 'Reset your GifHub password', `<p>Click to reset: <a href="${link}">${link}</a></p>`)
  return NextResponse.json({ ok: true })
}


