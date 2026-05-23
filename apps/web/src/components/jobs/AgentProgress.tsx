import type { JobStatus } from '@/types'

const STAGES = [
  { key: 'queued', label: 'Queued' },
  { key: 'running_chunk', label: 'Chunking' },
  { key: 'running_retrieve', label: 'Retrieving' },
  { key: 'running_analyze', label: 'Analyzing' },
  { key: 'running_evidence', label: 'Evidencing' },
  { key: 'running_score', label: 'Scoring' },
  { key: 'running_report', label: 'Writing Report' },
  { key: 'awaiting_review', label: 'Ready for Review' },
]

export default function AgentProgress({ status }: { status: JobStatus }) {
  const isRunning = status === 'running'
  const isDone = ['awaiting_review', 'approved', 'rejected'].includes(status)
  const isFailed = status === 'failed'

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {isRunning && (
          <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        <span className="text-sm font-medium text-blue-800">
          {isFailed ? 'Analysis failed' : isRunning ? 'Analysis in progress…' : 'Analysis complete'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {['Chunker', 'Retriever', 'Gap Analyzer', 'Evidencer', 'Risk Scorer', 'Report Writer'].map(agent => (
          <span
            key={agent}
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isDone
                ? 'bg-green-100 text-green-700'
                : isRunning
                ? 'bg-blue-100 text-blue-700 animate-pulse'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {agent}
          </span>
        ))}
      </div>
    </div>
  )
}
