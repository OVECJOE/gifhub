import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const repo = await prisma.repository.findUnique({ where: { id }, include: { gifs: true, tags: true } })
  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ repository: repo })
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  const existing = await prisma.repository.findUnique({ where: { id } })
  if (!existing || existing.userId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const data = await req.json()
  const repo = await prisma.repository.update({ where: { id }, data })
  return NextResponse.json({ repository: repo })
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  const existing = await prisma.repository.findUnique({ where: { id } })
  if (!existing || existing.userId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.repository.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}


