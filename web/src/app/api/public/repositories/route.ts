import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const repos = await prisma.repository.findMany({
    where: { isPublic: true },
    include: { tags: true, gifs: true },
    orderBy: { views: 'desc' },
    take: 50,
  })
  return NextResponse.json({ repositories: repos })
}


