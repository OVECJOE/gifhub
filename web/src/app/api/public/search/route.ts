import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSignedUrl, getGCSBucketName, extractFilePathFromGCSUrl } from '@/lib/gcs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const tag = searchParams.get('tag') || ''

  const where: {
    isPublic: true
    OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }>
    tags?: { some: { name: { equals: string; mode: 'insensitive' } } }
  } = { isPublic: true }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (tag) {
    where.tags = { some: { name: { equals: tag, mode: 'insensitive' } } }
  }

  try {
    const repos = await prisma.repository.findMany({ 
      where, 
      include: { tags: true, gifs: true }, 
      take: 50 
    })

    const bucketName = getGCSBucketName()
    const reposWithSignedUrls = await Promise.all(
      repos.map(async (repo) => {
        const gifsWithSignedUrls = await Promise.all(
          repo.gifs.map(async (gif) => {
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

        return {
          ...repo,
          gifs: gifsWithSignedUrls
        }
      })
    )

    return NextResponse.json({ repositories: reposWithSignedUrls })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to search repositories' 
    }, { status: 500 })
  }
}


