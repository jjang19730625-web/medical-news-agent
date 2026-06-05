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

interface SourceStatus {
  source: string
  status: 'idle' | 'loading' | 'done' | 'error'
  saved?: number
  found?: number
  error?: string
}

const ALL_SOURCES = ['WHO', 'CDC', 'NIH', 'PubMed', 'MedicalXpress', 'Google News', 'Reuters']
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
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([])

  const fetchArticles = useCallback(async (reset: boolean, currentOffset = 0) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)

    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(reset ? 0 : currentOffset),
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
      setOffset(currentOffset + LIMIT)
    }
    setTotal(data.total || 0)
    setLoading(false)
    setLoadingMore(false)
  }, [source, search])

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats')
    const data = await res.json()
    setStats(data)
  }, [])

  useEffect(() => {
    fetchArticles(true)
    fetchStats()
  }, [source, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => { fetchArticles(true); fetchStats() }, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCrawl = async () => {
    setCrawling(true)
    const initial: SourceStatus[] = ALL_SOURCES.map((s) => ({ source: s, status: 'loading' }))
    setSourceStatuses(initial)

    // Crawl all sources in parallel, one API call per source
    await Promise.all(
      ALL_SOURCES.map(async (src) => {
        try {
          const res = await fetch(`/api/crawl?source=${encodeURIComponent(src)}`, { method: 'POST' })
          const data = await res.json()
          setSourceStatuses((prev) =>
            prev.map((s) =>
              s.source === src
                ? { source: src, status: data.status === 'success' ? 'done' : 'error', saved: data.saved, found: data.found, error: data.error }
                : s
            )
          )
        } catch (err) {
          setSourceStatuses((prev) =>
            prev.map((s) => s.source === src ? { source: src, status: 'error', error: String(err) } : s)
          )
        }
      })
    )

    await fetchArticles(true)
    await fetchStats()
    setCrawling(false)

    setTimeout(() => setSourceStatuses([]), 8000)
  }

  const hasMore = articles.length < total

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <StatsBar stats={stats} crawling={crawling} onCrawl={handleCrawl} />

        {/* Per-source crawl progress */}
        {sourceStatuses.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-3 font-medium">소스별 수집 현황</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {sourceStatuses.map((s) => (
                <div
                  key={s.source}
                  className={`rounded-lg p-2 text-center text-xs border ${
                    s.status === 'loading' ? 'bg-gray-800 border-gray-700 text-gray-400' :
                    s.status === 'done'    ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
                    s.status === 'error'   ? 'bg-red-950 border-red-800 text-red-400' :
                    'bg-gray-900 border-gray-800 text-gray-600'
                  }`}
                >
                  <div className="font-semibold">{s.source}</div>
                  {s.status === 'loading' && (
                    <div className="mt-1 flex justify-center">
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  )}
                  {s.status === 'done'  && <div className="mt-0.5">+{s.saved ?? 0}개 저장</div>}
                  {s.status === 'error' && <div className="mt-0.5">실패</div>}
                </div>
              ))}
            </div>
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
                  onClick={() => fetchArticles(false, offset)}
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
