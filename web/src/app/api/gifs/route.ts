import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getSignedUrl, getGCSBucketName, extractFilePathFromGCSUrl } from '@/lib/gcs'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const recent = searchParams.get('recent')
  const limit = recent ? parseInt(recent) : 50
  try {
    const gifs = await prisma.gif.findMany({
      where: {
        OR: [
          {
            repository: {
              userId: user.id
            }
          },
          {
            userId: user.id,
            repositoryId: null
          }
        ]
      },
      include: {
        repository: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    const bucketName = getGCSBucketName()
    const gifsWithSignedUrls = await Promise.all(
      gifs.map(async (gif) => {
        let filePath: string

        if (gif.filename.startsWith('https://storage.googleapis.com/')) {
          const extracted = extractFilePathFromGCSUrl(gif.filename)
          if (!extracted) {
            console.warn(`Invalid file path for GIF ${gif.id}: ${gif.filename}`)
            return gif
          }
          filePath = extracted
        } else {
          filePath = gif.filename
        }

        try {
          const signedUrl = await getSignedUrl(bucketName, filePath, 60)
          return {
            ...gif,
            filename: signedUrl
          }
        } catch (error) {
          console.error(`Failed to generate signed URL for GIF ${gif.id}:`, error)
          return gif
        }
      })
    )

    return NextResponse.json({ gifs: gifsWithSignedUrls })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch GIFs' 
    }, { status: 500 })
  }
}
