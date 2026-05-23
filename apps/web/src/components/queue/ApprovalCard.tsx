'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/api'
import type { Job } from '@/types'

export default function ApprovalCard({ job, onAction }: { job: Job; onAction: () => void }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      await apiRequest(`/queue/${job.id}/${action}`, { method: 'POST' })
      onAction()
    } finally {
      setLoading(null)
    }
  }

  const summary = job.findings?.summary

  return (
    <div className="bg-white border border-amber-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{job.document_name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {job.framework === 'gdpr' ? 'GDPR' : 'EU AI Act'} · {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
          Awaiting Review
        </span>
      </div>

      {summary && (
        <div className="flex gap-4 text-sm mb-4">
          <span className="text-green-600 font-medium">{summary.compliant} compliant</span>
          <span className="text-amber-600 font-medium">{summary.partial} partial</span>
          <span className="text-red-600 font-medium">{summary.gaps} gaps</span>
          <span className="text-gray-500">{summary.compliance_percentage}% overall</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handle('approve')}
          disabled={loading !== null}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading === 'approve' ? 'Approving…' : 'Approve Report'}
        </button>
        <button
          onClick={() => handle('reject')}
          disabled={loading !== null}
          className="flex-1 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 text-sm font-medium rounded-lg border border-red-200 transition-colors"
        >
          {loading === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
    </div>
  )
}
