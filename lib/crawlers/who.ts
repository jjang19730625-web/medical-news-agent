import { parseRSS } from './rss'

export const SOURCE = 'WHO'

const FEEDS = [
  'https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml',
  'https://www.who.int/feeds/entity/csr/don/en/rss.xml',
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
