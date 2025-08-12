import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSignedUrl, getGCSBucketName, extractFilePathFromGCSUrl } from '@/lib/gcs'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  
  try {
    const repo = await prisma.repository.findUnique({
      where: { id, isPublic: true },
      include: {
        gifs: true,
        tags: true,
        user: { select: { name: true, email: true } },
      }
    })
    
    if (!repo) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Generate fresh signed URLs for all public GIFs
    const bucketName = getGCSBucketName()
    const gifsWithSignedUrls = await Promise.all(
      repo.gifs.map(async (gif) => {
        let filePath: string
        
        // Check if filename is already a file path or if we need to extract it
        if (gif.filename.startsWith('https://storage.googleapis.com/')) {
          const extracted = extractFilePathFromGCSUrl(gif.filename)
          if (!extracted) {
            console.warn(`Invalid file path for GIF ${gif.id}: ${gif.filename}`)
            return gif // Return original if we can't extract path
          }
          filePath = extracted
        } else {
          // Assume it's already a file path
          filePath = gif.filename
        }

        try {
          // Generate a signed URL that's valid for 1 hour
          const signedUrl = await getSignedUrl(bucketName, filePath, 60)
          return {
            ...gif,
            filename: signedUrl
          }
        } catch (error) {
          console.error(`Failed to generate signed URL for GIF ${gif.id}:`, error)
          return gif // Return original if signed URL generation fails
        }
      })
    )

    const repoWithSignedUrls = {
      ...repo,
      gifs: gifsWithSignedUrls
    }

    return NextResponse.json({ repository: repoWithSignedUrls })
  } catch (error) {
    console.error('Error fetching public repository:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch repository' 
    }, { status: 500 })
  }
}


