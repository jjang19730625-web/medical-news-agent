import { createClient } from '@supabase/supabase-js'

export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Article = {
  id: string
  title: string
  url: string
  source: string
  published_at: string | null
  summary: string | null
  content: string | null
  tags: string[]
  image_url: string | null
  created_at: string
}

export type CrawlLog = {
  id: string
  source: string
  status: 'running' | 'success' | 'error'
  articles_found: number
  articles_saved: number
  started_at: string
  completed_at: string | null
  error_message: string | null
}

export const SOURCE_META: Record<string, { color: string; badge: string; icon: string }> = {
  WHO:           { color: '#3b82f6', badge: 'bg-blue-900 text-blue-300 border-blue-700',       icon: '🌍' },
  CDC:           { color: '#ef4444', badge: 'bg-red-900 text-red-300 border-red-700',          icon: '🏛️' },
  NIH:           { color: '#6366f1', badge: 'bg-indigo-900 text-indigo-300 border-indigo-700', icon: '🔬' },
  PubMed:        { color: '#10b981', badge: 'bg-emerald-900 text-emerald-300 border-emerald-700', icon: '📄' },
  MedicalXpress: { color: '#f97316', badge: 'bg-orange-900 text-orange-300 border-orange-700', icon: '📰' },
  'Google News': { color: '#eab308', badge: 'bg-yellow-900 text-yellow-300 border-yellow-700', icon: '🔍' },
  Reuters:       { color: '#a855f7', badge: 'bg-purple-900 text-purple-300 border-purple-700', icon: '📡' },
}
