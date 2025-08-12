import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSignedUploadUrl, getGCSBucketName } from '@/lib/gcs'

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
    const { fileName, contentType, repositoryId } = body
    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 })
    }

    const bucketName = getGCSBucketName()
    const filePath = repositoryId 
      ? `gifs/${user.id}/${repositoryId}/${Date.now()}-${fileName}`
      : `gifs/${user.id}/orphaned/${Date.now()}-${fileName}`
    const signedUrl = await getSignedUploadUrl(bucketName, filePath, contentType, 15)

    return NextResponse.json({ 
      signedUrl,
      filePath,
      expiresIn: 15 * 60
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate presigned URL' 
    }, { status: 500 })
  }
}
