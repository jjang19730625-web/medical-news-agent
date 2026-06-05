import { parseRSS } from './rss'

export const SOURCE = 'CDC'

const FEEDS = [
  'https://tools.cdc.gov/api/v2/resources/media/132608.rss',
  'https://tools.cdc.gov/api/v2/resources/media/404952.rss',
]

export async function crawl() {
  const seen = new Set<string>()
  const articles = []

  for (const url of FEEDS) {
    const items = await parseRSS(url)
    for (const item of items) {
      if (!item.title || !item.link || seen.has(item.link)) continue
      seen.add(item.link)
      articles.push({
        title: item.title,
        url: item.link,
        source: SOURCE,
        published_at: item.isoDate || item.pubDate || null,
        content: item.content,
      })
    }
  }
  return articles
}
