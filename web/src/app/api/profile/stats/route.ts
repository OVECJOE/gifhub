import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  let userId = (session.user as { id?: string }).id
  if (!userId && session.user.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    userId = user?.id
  }
  
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  
  try {
    // Get user with creation date
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    })
    
    // Get repository stats
    const repositories = await prisma.repository.findMany({
      where: { userId },
      include: {
        gifs: {
          select: { downloads: true }
        }
      }
    })
    
    const stats = {
      repositories: repositories.length,
      gifs: repositories.reduce((sum, repo) => sum + repo.gifs.length, 0),
      totalViews: repositories.reduce((sum, repo) => sum + repo.views, 0),
      totalDownloads: repositories.reduce((sum, repo) => 
        sum + repo.gifs.reduce((gifSum, gif) => gifSum + gif.downloads, 0), 0
      ),
      publicRepositories: repositories.filter(repo => repo.isPublic).length,
      joinDate: user?.createdAt?.toISOString() || new Date().toISOString()
    }
    
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Profile stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
