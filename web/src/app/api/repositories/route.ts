import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // With JWT strategy, we can use session.user.id directly or fall back to email lookup
  let userId = (session.user as { id?: string }).id
  if (!userId && session.user.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    userId = user?.id
  }
  
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  
  const repos = await prisma.repository.findMany({ 
    where: { userId },
    include: {
      gifs: {
        select: { id: true }
      }
    }
  })
  return NextResponse.json({ repositories: repos })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // With JWT strategy, we can use session.user.id directly or fall back to email lookup
  let userId = (session.user as { id?: string }).id
  if (!userId && session.user.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    userId = user?.id
  }
  
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  
  const body = await req.json()
  const repo = await prisma.repository.create({ 
    data: { 
      name: body.name, 
      description: body.description,
      isPublic: body.isPublic,
      userId 
    } 
  })
  return NextResponse.json({ repository: repo }, { status: 201 })
}
