import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  await prisma.gif.update({ where: { id }, data: { downloads: { increment: 1 } } })
  return NextResponse.json({ ok: true })
}


