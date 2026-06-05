import { parseRSS } from './rss'

export const SOURCE = 'NIH'

// NIH blocks direct RSS — use Google News search targeting nih.gov + NCBI
const FEEDS = [
  'https://news.google.com/rss/search?q=site:nih.gov+research+health&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=NIH+clinical+trial+study+result&hl=en-US&gl=US&ceid=US:en',
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
