import { crawl as crawlWHO } from './lib/crawlers/who.js'
import { crawl as crawlGoogleNews } from './lib/crawlers/googlenews.js'
import { crawl as crawlPubMed } from './lib/crawlers/pubmed.js'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function run() {
  const results = await Promise.allSettled([
    crawlWHO(), crawlGoogleNews(), crawlPubMed()
  ])
  const names = ['WHO', 'Google News', 'PubMed']
  let all = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(names[i] + ':', r.value.length, 'articles')
      if (r.value[0]) console.log('  Sample:', r.value[0].title.substring(0,70))
      all = all.concat(r.value)
    } else {
      console.log(names[i] + ': ERROR -', r.reason.message)
    }
  })

  let saved = 0
  for (const a of all) {
    if (!a.url || !a.title) continue
    const { error } = await db.from('articles').upsert(
      { title: a.title, url: a.url, source: a.source, published_at: a.published_at, content: a.content?.substring(0,3000)||null },
      { onConflict: 'url', ignoreDuplicates: true }
    )
    if (!error) saved++
  }
  console.log('Saved', saved, 'of', all.length)
}
run().catch(e => console.error('FATAL:', e.message))
