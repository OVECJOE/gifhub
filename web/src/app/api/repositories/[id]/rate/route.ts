import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type RatingsData = { [repoId: string]: { total: number; count: number } }

async function readRatings() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.storage.from('meta').download('ratings.json')
  if (!data) return {} as RatingsData
  const text = await data.text()
  try { return JSON.parse(text) as RatingsData } catch { return {} as RatingsData }
}

async function writeRatings(payload: RatingsData) {
  const supabase = getSupabaseAdmin()
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  await supabase.storage.from('meta').upload('ratings.json', await blob.arrayBuffer(), { contentType: 'application/json', upsert: true })
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


