import { parseRSS } from './rss'

export const SOURCE = 'NIH'

const FEEDS = [
  'https://www.nih.gov/news-events/news-releases.xml',
  'https://www.niaid.nih.gov/news-events/news-releases/feed',
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
