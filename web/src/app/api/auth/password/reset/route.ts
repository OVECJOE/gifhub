import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(req: Request) {
  const { token, password } = await req.json()
  if (!token || typeof token !== 'string' || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const vt = await prisma.verificationToken.findUnique({ where: { token } })
  if (!vt || vt.expires < new Date() || !vt.identifier.startsWith('reset:')) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  const email = vt.identifier.replace(/^reset:/, '')
  await prisma.user.update({ where: { email }, data: { passwordHash: await hash(password, 10) } })
  await prisma.verificationToken.delete({ where: { token } })
  return NextResponse.json({ ok: true })
}


