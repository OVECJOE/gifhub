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

    if (gif.repository.userId !== user.id) {
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


