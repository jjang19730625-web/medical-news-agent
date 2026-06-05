'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import StatsBar from '@/components/StatsBar'
import SourceFilter from '@/components/SourceFilter'
import SearchBar from '@/components/SearchBar'
import ArticleCard from '@/components/ArticleCard'
import type { Article } from '@/lib/supabase'

interface Stats {
  total: number
  activeSources: number
  lastUpdated: string | null
}

const LIMIT = 24

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, activeSources: 0, lastUpdated: null })
  const [source, setSource] = useState('All')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [crawling, setCrawling] = useState(false)
  const [crawlResult, setCrawlResult] = useState<string | null>(null)

  const fetchArticles = useCallback(async (reset: boolean) => {
    const currentOffset = reset ? 0 : offset
    if (reset) setLoading(true)
    else setLoadingMore(true)

    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(currentOffset),
    })
    if (source !== 'All') params.set('source', source)
    if (search) params.set('search', search)

    const res = await fetch(`/api/articles?${params}`)
    const data = await res.json()

    if (reset) {
      setArticles(data.articles || [])
      setOffset(LIMIT)
    } else {
      setArticles((prev) => [...prev, ...(data.articles || [])])
      setOffset((o) => o + LIMIT)
    }
    setTotal(data.total || 0)
    setLoading(false)
    setLoadingMore(false)
  }, [source, search, offset])

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats')
    const data = await res.json()
    setStats(data)
  }, [])

  useEffect(() => {
    setOffset(0)
    fetchArticles(true)
    fetchStats()
  }, [source, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => {
      fetchArticles(true)
      fetchStats()
    }, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCrawl = async () => {
    setCrawling(true)
    setCrawlResult(null)
    try {
      const res = await fetch('/api/crawl', { method: 'POST' })
      const data = await res.json()
      setCrawlResult(`✅ ${data.totalSaved}개 새 기사 저장 완료 (${data.duration})`)
      await fetchArticles(true)
      await fetchStats()
    } catch {
      setCrawlResult('❌ 수집 중 오류 발생')
    } finally {
      setCrawling(false)
      setTimeout(() => setCrawlResult(null), 5000)
    }
  }

  const hasMore = articles.length < total

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <StatsBar stats={stats} crawling={crawling} onCrawl={handleCrawl} />

        {crawlResult && (
          <div className="text-sm text-center py-2 px-4 rounded-lg bg-gray-900 border border-gray-700 text-gray-300">
            {crawlResult}
          </div>
        )}

        <SourceFilter selected={source} onSelect={(s) => { setSource(s); setOffset(0) }} />
        <SearchBar value={search} onChange={(v) => { setSearch(v); setOffset(0) }} />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-56 animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 text-gray-500 space-y-3">
            <p className="text-5xl">🔬</p>
            <p className="text-lg font-medium text-gray-400">수집된 뉴스가 없습니다</p>
            <p className="text-sm">위의 <strong className="text-blue-400">지금 수집</strong> 버튼을 눌러 최신 뉴스를 가져오세요</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              총 <span className="text-gray-300 font-medium">{total.toLocaleString()}</span>개 중{' '}
              <span className="text-gray-300 font-medium">{articles.length}</span>개 표시
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => fetchArticles(false)}
                  disabled={loadingMore}
                  className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm px-6 py-2.5 rounded-lg transition-colors border border-gray-700"
                >
                  {loadingMore ? '로딩 중...' : `더 보기 (${total - articles.length}개 남음)`}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-12 py-6 text-center text-xs text-gray-600">
        Medical News Agent · WHO · CDC · NIH · PubMed · MedicalXpress · Google News · Reuters
      </footer>
    </div>
  )
}
