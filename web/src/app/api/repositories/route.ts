import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  const repos = await prisma.repository.findMany({ where: { userId: user?.id } })
  return NextResponse.json({ repositories: repos })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  const body = await req.json()
  const repo = await prisma.repository.create({ data: { name: body.name, description: body.description, userId: user!.id } })
  return NextResponse.json({ repository: repo }, { status: 201 })
}


