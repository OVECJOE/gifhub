import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  
  try {
    // Increment the view count for the repository
    await prisma.repository.update({
      where: { id },
      data: {
        views: {
          increment: 1
        }
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error incrementing repository views:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to increment views' 
    }, { status: 500 })
  }
}