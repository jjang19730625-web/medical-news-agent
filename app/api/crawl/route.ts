import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { crawlAll, CrawledArticle } from '@/lib/crawlers'
import { crawl as crawlWHO } from '@/lib/crawlers/who'
import { crawl as crawlCDC } from '@/lib/crawlers/cdc'
import { crawl as crawlNIH } from '@/lib/crawlers/nih'
import { crawl as crawlPubMed } from '@/lib/crawlers/pubmed'
import { crawl as crawlMedicalXpress } from '@/lib/crawlers/medicalxpress'
import { crawl as crawlGoogleNews } from '@/lib/crawlers/googlenews'
import { crawl as crawlReuters } from '@/lib/crawlers/reuters'
import { summarizeArticle } from '@/lib/openrouter'

export const runtime = 'nodejs'
export const maxDuration = 60

const SOURCE_MAP: Record<string, () => Promise<CrawledArticle[]>> = {
  WHO: crawlWHO,
  CDC: crawlCDC,
  NIH: crawlNIH,
  PubMed: crawlPubMed,
  MedicalXpress: crawlMedicalXpress,
  'Google News': crawlGoogleNews,
  Reuters: crawlReuters,
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Cron: crawl a random source each day to stay within limits
  const sources = Object.keys(SOURCE_MAP)
  const today = new Date().getDay()
  const source = sources[today % sources.length]
  return runSourceCrawl(source)
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const source = searchParams.get('source')

  if (source && SOURCE_MAP[source]) {
    return runSourceCrawl(source)
  }

  // No specific source: run all (used when called without source param)
  const results = await crawlAll()
  const db = getDb()
  let totalSaved = 0
  const report = []

  for (const { source: src, articles, error } of results) {
    if (error) { report.push({ source: src, status: 'error', error }); continue }
    const saved = await saveArticles(db, articles)
    totalSaved += saved
    report.push({ source: src, status: 'success', found: articles.length, saved })
  }

  return NextResponse.json({ success: true, totalSaved, report })
}

async function runSourceCrawl(source: string) {
  const crawlFn = SOURCE_MAP[source]
  if (!crawlFn) {
    return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 })
  }

  const db = getDb()
  const start = Date.now()

  let articles: CrawledArticle[] = []
  let crawlError: string | undefined

  try {
    articles = await crawlFn()
  } catch (err) {
    crawlError = (err as Error).message
    await db.from('crawl_logs').insert({
      source,
      status: 'error',
      articles_found: 0,
      articles_saved: 0,
      completed_at: new Date().toISOString(),
      error_message: crawlError,
    })
    return NextResponse.json({ source, status: 'error', error: crawlError })
  }

  const saved = await saveArticles(db, articles)

  await db.from('crawl_logs').insert({
    source,
    status: 'success',
    articles_found: articles.length,
    articles_saved: saved,
    completed_at: new Date().toISOString(),
  })

  return NextResponse.json({
    source,
    status: 'success',
    found: articles.length,
    saved,
    duration: `${((Date.now() - start) / 1000).toFixed(1)}s`,
  })
}

async function saveArticles(db: ReturnType<typeof createClient>, articles: CrawledArticle[]) {
  let saved = 0

  for (const article of articles.slice(0, 15)) {
    try {
      const { data: existing } = await db
        .from('articles')
        .select('id')
        .eq('url', article.url)
        .maybeSingle()

      if (existing) continue

      let summary: string | null = null
      let tags: string[] = []

      try {
        const result = await summarizeArticle(article.title, article.content)
        summary = result.summary || null
        tags = result.tags
      } catch { /* LLM optional */ }

      const { error } = await db.from('articles').insert({
        title: article.title,
        url: article.url,
        source: article.source,
        published_at: article.published_at,
        content: article.content?.substring(0, 5000) || null,
        summary,
        tags,
      })

      if (!error) saved++
    } catch { /* skip */ }
  }

  return saved
}
