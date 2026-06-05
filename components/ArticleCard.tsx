import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Article, SOURCE_META } from '@/lib/supabase'

interface Props {
  article: Article
}

export default function ArticleCard({ article }: Props) {
  const meta = SOURCE_META[article.source] || {
    badge: 'bg-gray-800 text-gray-300 border-gray-600',
    icon: '📰',
    color: '#6b7280',
  }

  const date = article.published_at || article.created_at
  const timeAgo = date
    ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko })
    : ''

  return (
    <article className="group flex flex-col bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}>
          <span>{meta.icon}</span>
          {article.source}
        </span>
        {timeAgo && (
          <span className="text-xs text-gray-500">{timeAgo}</span>
        )}
      </div>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-white leading-snug line-clamp-2 hover:text-blue-400 transition-colors mb-2 group-hover:text-blue-300"
      >
        {article.title}
      </a>

      {article.summary ? (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 flex-1 mb-3">
          {article.summary}
        </p>
      ) : (
        <p className="text-xs text-gray-600 italic flex-1 mb-3">AI 요약 없음</p>
      )}

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {article.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 mt-auto"
      >
        원문 보기
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </article>
  )
}
