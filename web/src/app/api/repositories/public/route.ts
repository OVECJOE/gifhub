import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const trending = searchParams.get('trending') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')
  
  const repos = await prisma.repository.findMany({ 
    where: { isPublic: true }, 
    include: { 
      gifs: { select: { id: true } }, 
      tags: true,
      user: { select: { name: true, email: true } }
    },
    orderBy: trending 
      ? [{ views: 'desc' }, { createdAt: 'desc' }]
      : { views: 'desc' },
    take: limit
  })
  return NextResponse.json({ repositories: repos })
}


