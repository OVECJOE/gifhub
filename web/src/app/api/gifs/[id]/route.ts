import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const gif = await prisma.gif.findUnique({ where: { id } })
  if (!gif) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ gif })
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const gif = await prisma.gif.findUnique({ where: { id }, include: { repository: true } })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!gif || gif.repository.userId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.gif.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}


