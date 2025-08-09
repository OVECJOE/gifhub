import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const repo = await prisma.repository.findUnique({ where: { id, isPublic: true }, include: { gifs: true, tags: true } })
  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ repository: repo })
}


