import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const repos = await prisma.repository.findMany({ where: { isPublic: true }, include: { gifs: true, tags: true } })
  return NextResponse.json({ repositories: repos })
}


