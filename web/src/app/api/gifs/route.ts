import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const recent = searchParams.get('recent')
  
  if (recent) {
    // Get recent GIFs for authenticated user
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    let userId = (session.user as { id?: string }).id
    if (!userId && session.user.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      userId = user?.id
    }
    
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    
    const limit = parseInt(recent) || 5
    const gifs = await prisma.gif.findMany({
      where: {
        repository: {
          userId
        }
      },
      include: {
        repository: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    
    return NextResponse.json({ gifs })
  }
  
  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
