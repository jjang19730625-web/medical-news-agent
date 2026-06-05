import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const [countRes, sourcesRes, latestRes, logsRes] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('source'),
    supabase.from('articles').select('created_at').order('created_at', { ascending: false }).limit(1),
    supabase.from('crawl_logs').select('source, status, completed_at').order('started_at', { ascending: false }).limit(14),
  ])

  const sources = [...new Set((sourcesRes.data || []).map((a) => a.source))]

  return NextResponse.json({
    total: countRes.count ?? 0,
    activeSources: sources.length,
    lastUpdated: latestRes.data?.[0]?.created_at ?? null,
    recentLogs: logsRes.data ?? [],
  })
}
