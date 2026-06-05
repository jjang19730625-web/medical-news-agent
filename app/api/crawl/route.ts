import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { crawlAll } from '@/lib/crawlers'
import { summarizeArticle } from '@/lib/openrouter'

export const runtime = 'nodejs'
export const maxDuration = 300

function getSupabase() {
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
  return runCrawl()
}

export async function POST() {
  return runCrawl()
}

async function runCrawl() {
  const db = getSupabase()
  const start = Date.now()
  let totalSaved = 0
  const report: object[] = []

  const sources = await crawlAll()

  for (const { source, articles, error } of sources) {
    if (error) {
      report.push({ source, status: 'error', error })

      await db.from('crawl_logs').insert({
        source,
        status: 'error',
        articles_found: 0,
        articles_saved: 0,
        completed_at: new Date().toISOString(),
        error_message: error,
      })
      continue
    }

    let saved = 0

    for (const article of articles.slice(0, 20)) {
      try {
        const { data: existing } = await db
          .from('articles')
          .select('id')
          .eq('url', article.url)
          .maybeSingle()

        if (existing) continue

        const { summary, tags } = await summarizeArticle(article.title, article.content)

        const { error: insertErr } = await db.from('articles').insert({
          title: article.title,
          url: article.url,
          source: article.source,
          published_at: article.published_at,
          content: article.content?.substring(0, 5000) || null,
          summary: summary || null,
          tags,
        })

        if (!insertErr) saved++
      } catch (err) {
        console.error(`Insert error [${source}]:`, err)
      }
    }

    totalSaved += saved
    report.push({ source, status: 'success', found: articles.length, saved })

    await db.from('crawl_logs').insert({
      source,
      status: 'success',
      articles_found: articles.length,
      articles_saved: saved,
      completed_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({
    success: true,
    duration: `${((Date.now() - start) / 1000).toFixed(1)}s`,
    totalSaved,
    report,
  })
}
