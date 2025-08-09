import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const tag = (searchParams.get('tag') || '').trim()

  const where: {
    isPublic: true
    OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }>
    tags?: { some: { name: { equals: string; mode: 'insensitive' } } }
  } = { isPublic: true }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (tag) {
    where.tags = { some: { name: { equals: tag, mode: 'insensitive' } } }
  }

  const repos = await prisma.repository.findMany({ where, include: { tags: true, gifs: true }, take: 50 })
  return NextResponse.json({ repositories: repos })
}


