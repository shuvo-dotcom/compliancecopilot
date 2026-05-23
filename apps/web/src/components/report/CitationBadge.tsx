import type { Citation } from '@/types'

export default function CitationBadge({ citation }: { citation: Citation }) {
  if (!citation.citation) return null

  return (
    <div className="mt-2 p-2.5 bg-gray-50 border-l-2 border-sky-400 rounded-r-lg">
      <p className="text-xs text-gray-500 mb-1">{citation.page_hint}</p>
      <blockquote className="text-xs text-gray-700 italic">"{citation.citation}"</blockquote>
    </div>
  )
}
