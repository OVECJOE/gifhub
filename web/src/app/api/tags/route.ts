import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ tags })
}

export async function POST(req: Request) {
  const { name } = await req.json()
  if (!name || typeof name !== 'string') return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
  return NextResponse.json({ tag }, { status: 201 })
}


