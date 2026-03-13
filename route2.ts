import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('love_feed')
    .select('region, time, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ feed: data ?? [] })
}
