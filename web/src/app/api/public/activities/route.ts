import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  
  try {
    // Get recent public repositories (simulating repository creation activity)
    const recentRepos = await prisma.repository.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 2)
    })
    
    // Get recent GIFs from public repositories (simulating GIF upload activity)
    const recentGifs = await prisma.gif.findMany({
      where: {
        repository: { isPublic: true }
      },
      include: {
        repository: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit / 2)
    })
    
    // Combine and format activities
    const activities = [
      ...recentRepos.map(repo => ({
        id: `repo_${repo.id}`,
        type: 'repository_created' as const,
        user: repo.user,
        repository: {
          id: repo.id,
          name: repo.name,
          description: repo.description
        },
        createdAt: repo.createdAt.toISOString()
      })),
      ...recentGifs.map(gif => ({
        id: `gif_${gif.id}`,
        type: 'gif_uploaded' as const,
        user: gif.repository.user,
        repository: {
          id: gif.repository.id,
          name: gif.repository.name,
          description: gif.repository.description
        },
        createdAt: gif.createdAt.toISOString()
      }))
    ]
    
    // Sort by creation date and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
    
    return NextResponse.json({ activities: sortedActivities })
  } catch (error) {
    console.error('Activities fetch error:', error)
    return NextResponse.json({ activities: [] })
  }
}
