import { crawl as crawlWHO } from './who'
import { crawl as crawlCDC } from './cdc'
import { crawl as crawlNIH } from './nih'
import { crawl as crawlPubMed } from './pubmed'
import { crawl as crawlMedicalXpress } from './medicalxpress'
import { crawl as crawlGoogleNews } from './googlenews'
import { crawl as crawlReuters } from './reuters'

export interface CrawledArticle {
  title: string
  url: string
  source: string
  published_at: string | null
  content: string
}

export interface CrawlResult {
  source: string
  articles: CrawledArticle[]
  error?: string
}

const CRAWLERS: Record<string, () => Promise<CrawledArticle[]>> = {
  WHO: crawlWHO,
  CDC: crawlCDC,
  NIH: crawlNIH,
  PubMed: crawlPubMed,
  MedicalXpress: crawlMedicalXpress,
  'Google News': crawlGoogleNews,
  Reuters: crawlReuters,
}

export async function crawlAll(): Promise<CrawlResult[]> {
  const entries = Object.entries(CRAWLERS)
  const results = await Promise.allSettled(
    entries.map(([, fn]) => fn())
  )

  return results.map((result, i) => {
    const [source] = entries[i]
    if (result.status === 'fulfilled') {
      return { source, articles: result.value }
    }
    const error = (result.reason as Error)?.message || 'Unknown error'
    console.error(`Crawl failed [${source}]: ${error}`)
    return { source, articles: [], error }
  })
}
