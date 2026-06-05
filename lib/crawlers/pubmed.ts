export const SOURCE = 'PubMed'

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const QUERIES = [
  'infectious disease outbreak',
  'emerging virus pandemic',
  'antimicrobial resistance',
]

export async function crawl() {
  const articles = []
  const seen = new Set<string>()

  for (const term of QUERIES) {
    try {
      const searchUrl =
        `${BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}` +
        `&retmax=5&sort=date&retmode=json&datetype=pdat&reldate=14`
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) })
      const searchData = await searchRes.json()
      const ids: string[] = searchData.esearchresult?.idlist || []

      if (ids.length === 0) continue

      const summaryUrl = `${BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
      const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(10000) })
      const summaryData = await summaryRes.json()
      const result = summaryData.result || {}

      for (const id of ids) {
        const art = result[id]
        if (!art || art.error || seen.has(id)) continue
        seen.add(id)

        const title = (art.title || '').replace(/<[^>]+>/g, '').trim()
        if (!title) continue

        const authors = (art.authors || [])
          .slice(0, 3)
          .map((a: { name: string }) => a.name)
          .join(', ')
        const journal = art.fulljournalname || art.source || ''

        articles.push({
          title,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          source: SOURCE,
          published_at: art.pubdate ? new Date(art.pubdate).toISOString() : null,
          content: `${journal}. ${authors}.`.trim(),
        })
      }
    } catch (err) {
      console.error(`PubMed error [${term}]:`, (err as Error).message)
    }
  }

  return articles
}
