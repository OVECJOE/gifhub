import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getSignedUrl, getGCSBucketName, extractFilePathFromGCSUrl } from '@/lib/gcs'

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  
  try {
    const gif = await prisma.gif.findUnique({
      where: { id },
      include: { repository: true }
    })

    if (!gif) {
      return NextResponse.json({ error: 'GIF not found' }, { status: 404 })
    }

    const bucketName = getGCSBucketName()
    let filePath: string

    if (gif.filename.startsWith('https://storage.googleapis.com/')) {
      const extracted = extractFilePathFromGCSUrl(gif.filename)
      if (!extracted) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
      }
      filePath = extracted
    } else {
      filePath = gif.filename
    }

    const signedUrl = await getSignedUrl(bucketName, filePath, 60)
    return NextResponse.json({ 
      gif: {
        ...gif,
        filename: signedUrl
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch GIF' 
    }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const gif = await prisma.gif.findUnique({
      where: { id },
      include: { repository: true }
    })

    if (!gif) {
      return NextResponse.json({ error: 'GIF not found' }, { status: 404 })
    }

    // Check if user owns the GIF
    if (gif.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.gif.delete({ where: { id } })
    return NextResponse.json({ message: 'GIF deleted successfully' })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete GIF' 
    }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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
    const { repositoryId } = body
    if (!repositoryId) {
      return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 })
    }

    const gif = await prisma.gif.findUnique({ where: { id } })
    if (!gif) {
      return NextResponse.json({ error: 'GIF not found' }, { status: 404 })
    }

    if (gif.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify the repository belongs to the user
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId }
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (repository.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the GIF's repository association
    const updatedGif = await prisma.gif.update({
      where: { id },
      data: { repositoryId },
      include: { repository: true }
    })

    return NextResponse.json({ gif: updatedGif })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update GIF' 
    }, { status: 500 })
  }
}


