import { NextResponse } from 'next/server'
import { uploadToGCS, getGCSBucketName, getGCSClient } from '@/lib/gcs'

type RatingsData = { [repoId: string]: { total: number; count: number } }

async function readRatings(): Promise<RatingsData> {
  try {
    const storage = getGCSClient()
    const bucketName = getGCSBucketName()
    const file = storage.bucket(bucketName).file('meta/ratings.json')
    
    const [exists] = await file.exists()
    if (!exists) return {}
    
    const [data] = await file.download()
    const text = data.toString('utf-8')
    return JSON.parse(text) as RatingsData
  } catch (error) {
    console.warn('Failed to read ratings:', error)
    return {}
  }
}

async function writeRatings(payload: RatingsData): Promise<void> {
  const bucketName = getGCSBucketName()
  const jsonData = JSON.stringify(payload, null, 2)
  
  await uploadToGCS({
    bucketName,
    fileName: 'meta/ratings.json',
    buffer: Buffer.from(jsonData, 'utf-8'),
    contentType: 'application/json',
    metadata: {
      updatedAt: new Date().toISOString(),
      type: 'ratings',
    },
  })
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { rating } = await req.json()
  const r = Number(rating)
  if (!Number.isFinite(r) || r < 1 || r > 5) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  const ratings = await readRatings()
  const entry = ratings[id] || { total: 0, count: 0 }
  entry.total += r
  entry.count += 1
  ratings[id] = entry
  await writeRatings(ratings)
  const avg = entry.total / entry.count
  return NextResponse.json({ average: avg, count: entry.count })
}


