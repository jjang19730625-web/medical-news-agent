'use client'

import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Stats {
  total: number
  activeSources: number
  lastUpdated: string | null
}

interface Props {
  stats: Stats
  crawling: boolean
  onCrawl: () => void
}

export default function StatsBar({ stats, crawling, onCrawl }: Props) {
  const lastUpdated = stats.lastUpdated
    ? formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true, locale: ko })
    : '없음'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-3 flex-1">
        <StatCard icon="📰" label="수집된 뉴스" value={stats.total.toLocaleString()} />
        <StatCard icon="🌐" label="활성 소스" value={`${stats.activeSources} / 7`} />
        <StatCard icon="🕐" label="마지막 업데이트" value={lastUpdated} />
      </div>
      <button
        onClick={onCrawl}
        disabled={crawling}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
      >
        {crawling ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            수집 중...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            지금 수집
          </>
        )}
      </button>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  )
}
