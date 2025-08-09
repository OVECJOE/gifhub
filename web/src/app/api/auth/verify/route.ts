import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/login?verified=0', req.url))
  const vt = await prisma.verificationToken.findUnique({ where: { token } })
  if (!vt || vt.expires < new Date()) return NextResponse.redirect(new URL('/login?verified=0', req.url))
  await prisma.user.update({ where: { email: vt.identifier }, data: { emailVerified: new Date() } })
  await prisma.verificationToken.delete({ where: { token } })
  return NextResponse.redirect(new URL('/login?verified=1', req.url))
}


