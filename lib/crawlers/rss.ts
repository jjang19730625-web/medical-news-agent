import Parser from 'rss-parser'

export interface RSSItem {
  title: string
  link: string
  content: string
  pubDate: string | undefined
  isoDate: string | undefined
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; MedicalNewsBot/1.0)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [['content:encoded', 'contentEncoded'], 'description'],
  },
})

export async function parseRSS(url: string): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(url)
    return feed.items.map((item) => ({
      title: (item.title || '').replace(/<[^>]+>/g, '').trim(),
      link: item.link || item.guid || '',
      content: (
        ((item as unknown) as Record<string, string>).contentEncoded ||
        item.content ||
        item.contentSnippet ||
        item.summary ||
        ((item as unknown) as Record<string, string>).description ||
        ''
      )
        .replace(/<[^>]+>/g, '')
        .trim()
        .substring(0, 3000),
      pubDate: item.pubDate,
      isoDate: item.isoDate,
    }))
  } catch (err) {
    console.error(`RSS parse error [${url}]:`, (err as Error).message)
    return []
  }
}
