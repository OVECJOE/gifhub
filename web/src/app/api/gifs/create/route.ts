import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { 
      filePath, 
      originalName, 
      fileSize, 
      duration, 
      width, 
      height, 
      repositoryId 
    } = body

    if (!filePath || !originalName || !fileSize || !duration || !width || !height) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const gif = await prisma.gif.create({
      data: {
        filename: filePath,
        originalName,
        fileSize,
        duration,
        width,
        height,
        repositoryId: repositoryId || null,
        userId: user.id,
      },
    })

    return NextResponse.json({ gif }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create GIF record' 
    }, { status: 500 })
  }
}
