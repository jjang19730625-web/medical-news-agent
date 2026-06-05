import { parseRSS } from './rss'

export const SOURCE = 'Reuters'

const FEEDS = [
  'https://feeds.reuters.com/reuters/healthNews',
  'https://news.google.com/rss/search?q=reuters+health+medicine&hl=en-US&gl=US&ceid=US:en',
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
    if (articles.length > 0) break
  }
  return articles
}
