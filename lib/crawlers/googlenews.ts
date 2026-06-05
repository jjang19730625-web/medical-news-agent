import { parseRSS } from './rss'

export const SOURCE = 'Google News'

const FEEDS = [
  // Health topic feed
  'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNR3QwTlRFU0FtVnVHZ0pWVXlBQVAB?hl=en-US&gl=US&ceid=US:en',
  // Disease outbreak search
  'https://news.google.com/rss/search?q=disease+outbreak+health&hl=en-US&gl=US&ceid=US:en',
  // Pandemic/epidemic search
  'https://news.google.com/rss/search?q=pandemic+epidemic+virus&hl=en-US&gl=US&ceid=US:en',
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
