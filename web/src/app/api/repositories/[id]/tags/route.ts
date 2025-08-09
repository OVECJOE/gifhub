import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  const repo = await prisma.repository.findUnique({ where: { id }, include: { tags: true } })
  if (!repo || repo.userId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const names: string[] = Array.isArray(body?.names) ? body.names : []
  const tags = await Promise.all(names.map(async (name) => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })))
  const updated = await prisma.repository.update({ where: { id }, data: { tags: { set: [], connect: tags.map(t => ({ id: t.id })) } }, include: { tags: true } })
  return NextResponse.json({ repository: updated })
}


