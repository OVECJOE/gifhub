import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { uploadToGCS, getGCSBucketName } from '@/lib/gcs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const repositoryId = form.get('repositoryId') as string | null
  const metadataRaw = form.get('metadata') as string | null
  if (!file || !repositoryId || !metadataRaw) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const metadata = JSON.parse(metadataRaw) as { originalName: string; duration: number; width: number; height: number }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const filePath = `gifs/${user.id}/${repositoryId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const bucketName = getGCSBucketName()

    await uploadToGCS({
      bucketName,
      fileName: filePath,
      buffer: Buffer.from(arrayBuffer),
      contentType: 'image/gif',
      metadata: {
        userId: user.id,
        repositoryId,
        originalName: metadata.originalName,
        uploadedAt: new Date().toISOString(),
      },
    })

    const gif = await prisma.gif.create({
      data: {
        filename: filePath,
        originalName: metadata.originalName,
        fileSize: file.size,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        repositoryId,
      },
    })

    return NextResponse.json({ gif }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, { status: 500 })
  }
}


