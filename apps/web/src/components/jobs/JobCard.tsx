import Link from 'next/link'
import type { Job } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-700',
  awaiting_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  failed: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  running: 'Analyzing…',
  awaiting_review: 'Needs Review',
  approved: 'Approved',
  rejected: 'Rejected',
  failed: 'Failed',
}

export default function JobCard({ job }: { job: Job }) {
  const frameworkLabel = job.framework === 'gdpr' ? 'GDPR' : 'EU AI Act'
  const date = new Date(job.created_at).toLocaleDateString()

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{job.document_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{frameworkLabel} · {date}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {job.status === 'running' && (
              <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[job.status] ?? STATUS_STYLES.queued}`}>
              {STATUS_LABELS[job.status] ?? job.status}
            </span>
          </div>
        </div>
        {job.findings?.summary && (
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span className="text-green-600 font-medium">{job.findings.summary.compliant} compliant</span>
            <span className="text-amber-600 font-medium">{job.findings.summary.partial} partial</span>
            <span className="text-red-600 font-medium">{job.findings.summary.gaps} gaps</span>
          </div>
        )}
      </div>
    </Link>
  )
}
