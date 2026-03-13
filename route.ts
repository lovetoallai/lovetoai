import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: fetch current counts
export async function GET() {
  const today = new Date().toISOString().slice(0, 10)

  const [counterRes, todayRes] = await Promise.all([
    supabase.from('love_counter').select('count').eq('id', 1).single(),
    supabase.from('love_daily').select('count').eq('date', today).single(),
  ])

  return NextResponse.json({
    total: counterRes.data?.count ?? 0,
    today: todayRes.data?.count ?? 0,
  })
}

// POST: increment counter + record feed item
export async function POST(req: Request) {
  const { region } = await req.json()
  const today = new Date().toISOString().slice(0, 10)
  const time = new Date().toISOString().slice(11, 19) + ' UTC'

  // Atomic increment total
  const { data, error } = await supabase.rpc('increment_love')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Upsert daily count
  await supabase.rpc('increment_love_daily', { p_date: today })

  // Insert feed item
  await supabase.from('love_feed').insert({ region, time })

  return NextResponse.json({ total: data })
}
