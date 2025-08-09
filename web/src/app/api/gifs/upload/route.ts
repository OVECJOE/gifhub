import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin'
import { prisma } from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

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

  const arrayBuffer = await file.arrayBuffer()
  const filePath = `${user.id}/${repositoryId}/${Date.now()}-${file.name}`

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.storage.from('gifs').upload(filePath, Buffer.from(arrayBuffer), {
    contentType: 'image/gif',
  })
  if (error) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

  const { data: publicUrlData } = supabaseAdmin.storage.from('gifs').getPublicUrl(filePath)

  const gif = await prisma.gif.create({
    data: {
      filename: publicUrlData.publicUrl,
      originalName: metadata.originalName,
      fileSize: file.size,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      repositoryId,
    },
  })

  return NextResponse.json({ gif }, { status: 201 })
}


