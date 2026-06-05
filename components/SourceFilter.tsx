'use client'

import { SOURCE_META } from '@/lib/supabase'

const SOURCES = ['All', 'WHO', 'CDC', 'NIH', 'PubMed', 'MedicalXpress', 'Google News', 'Reuters']

interface Props {
  selected: string
  onSelect: (source: string) => void
}

export default function SourceFilter({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {SOURCES.map((source) => {
        const meta = SOURCE_META[source]
        const isActive = selected === source
        return (
          <button
            key={source}
            onClick={() => onSelect(source)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-all duration-150 font-medium ${
              isActive
                ? source === 'All'
                  ? 'bg-white text-gray-900 border-white'
                  : `${meta.badge} border-opacity-100`
                : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            {meta && <span>{meta.icon}</span>}
            {source}
          </button>
        )
      })}
    </div>
  )
}
