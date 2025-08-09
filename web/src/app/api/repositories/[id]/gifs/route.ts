import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: targetRepositoryId } = await context.params
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const repo = await prisma.repository.findUnique({ where: { id: targetRepositoryId } })
  if (!repo || repo.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { gifId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { gifId } = body || {}
  if (!gifId) return NextResponse.json({ error: 'gifId is required' }, { status: 400 })

  const existingGif = await prisma.gif.findUnique({
    where: { id: gifId },
    include: { repository: true },
  })
  if (!existingGif) return NextResponse.json({ error: 'GIF not found' }, { status: 404 })
  if (existingGif.repository.userId !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Prevent duplicate by same filename in the target repository
  const duplicate = await prisma.gif.findFirst({
    where: { repositoryId: targetRepositoryId, filename: existingGif.filename },
  })
  if (duplicate) return NextResponse.json({ gif: duplicate }, { status: 200 })

  // Copy metadata (do not move); reuse the same file URL
  const newGif = await prisma.gif.create({
    data: {
      filename: existingGif.filename,
      originalName: existingGif.originalName,
      fileSize: existingGif.fileSize,
      duration: existingGif.duration,
      width: existingGif.width,
      height: existingGif.height,
      repositoryId: targetRepositoryId,
    },
  })

  return NextResponse.json({ gif: newGif }, { status: 201 })
}


