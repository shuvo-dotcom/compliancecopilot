'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/api'
import type { Job, Finding } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  compliant: 'bg-green-50 border-green-200 text-green-700',
  partial:   'bg-amber-50  border-amber-200  text-amber-700',
  gap:       'bg-red-50    border-red-200    text-red-700',
}
const SEV_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-amber-100 text-amber-700',
  low:      'bg-gray-100 text-gray-600',
}
const CHECK_ICON: Record<string, string>  = { compliant: '✓', partial: '◐', missing: '✗' }
const CHECK_COLOR: Record<string, string> = {
  compliant: 'text-green-600', partial: 'text-amber-600', missing: 'text-red-600',
}

export default function ApprovalCard({ job, onAction }: { job: Job; onAction: () => void }) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const findings: Finding[] = job.findings?.findings ?? []
  const summary = job.findings?.summary

  async function handleAction(type: 'approve' | 'reject') {
    setAction(type)
    try {
      await apiRequest(`/queue/${job.id}/${type}`, { method: 'POST' })
      onAction()
    } finally {
      setAction(null)
    }
  }

  async function saveFinding(findingId: string) {
    if (!edits[findingId]) return
    setSaving(findingId)
    try {
      await apiRequest(`/queue/${job.id}/findings/${findingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ summary: edits[findingId] }),
      })
      setEdits(e => { const n = { ...e }; delete n[findingId]; return n })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">{job.document_name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {job.framework === 'gdpr' ? 'GDPR (EU 2016/679)' : 'EU AI Act (2024)'}
            {' · '}{new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          Awaiting Review
        </span>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-6 text-sm">
          <span className="text-green-700 font-medium">{summary.compliant} compliant</span>
          <span className="text-amber-700 font-medium">{summary.partial} partial</span>
          <span className="text-red-700 font-medium">{summary.gaps} gaps</span>
          <span className="ml-auto text-gray-500 font-medium">{summary.compliance_percentage}% overall</span>
        </div>
      )}

      {/* Executive summary */}
      {job.findings?.executive_summary && (
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Executive Summary</p>
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{job.findings.executive_summary}</p>
        </div>
      )}

      {/* Findings list */}
      {findings.length > 0 && (
        <div className="divide-y divide-gray-100">
          <p className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
            Findings — click to expand &amp; edit
          </p>
          {findings
            .slice()
            .sort((a, b) => b.risk_score - a.risk_score)
            .map(f => {
              const isOpen = expanded === f.requirement_id
              const edited = edits[f.requirement_id]
              return (
                <div key={f.requirement_id} className="border-b border-gray-100 last:border-0">
                  {/* Row header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : f.requirement_id)}
                    className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className={`shrink-0 w-2 h-2 rounded-full ${
                      f.overall_status === 'compliant' ? 'bg-green-500' :
                      f.overall_status === 'partial'   ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-gray-400 font-mono w-24 shrink-0">{f.article}</span>
                    <span className="text-sm text-gray-800 font-medium flex-1 truncate">{f.title}</span>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${SEV_STYLES[f.severity] ?? SEV_STYLES.medium}`}>
                      {f.severity}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-gray-700 w-8 text-right">{f.risk_score}</span>
                    <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className={`px-6 pb-5 ${STATUS_STYLES[f.overall_status] ?? ''} border-l-4 mx-4 mb-3 rounded-r-lg`}>
                      {/* Editable summary */}
                      <div className="mt-3 mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Summary</p>
                        <textarea
                          className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                          rows={3}
                          defaultValue={f.summary}
                          onChange={e => setEdits(prev => ({ ...prev, [f.requirement_id]: e.target.value }))}
                        />
                        {edited && (
                          <button
                            onClick={() => saveFinding(f.requirement_id)}
                            disabled={saving === f.requirement_id}
                            className="mt-1 text-xs px-3 py-1 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
                          >
                            {saving === f.requirement_id ? 'Saving…' : 'Save edit'}
                          </button>
                        )}
                      </div>

                      {/* Check results */}
                      <div className="space-y-2">
                        {f.check_results.map((cr, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className={`font-bold shrink-0 mt-0.5 ${CHECK_COLOR[cr.status] ?? ''}`}>
                              {CHECK_ICON[cr.status] ?? '?'}
                            </span>
                            <div>
                              <p className="text-gray-800">{cr.check}</p>
                              {cr.explanation && <p className="text-xs text-gray-500 mt-0.5">{cr.explanation}</p>}
                              {cr.evidence && <p className="text-xs text-gray-600 italic mt-0.5">"{cr.evidence}"</p>}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="mt-3 text-xs text-gray-500">
                        Priority: <span className="font-medium">{f.remediation_priority}</span>
                        {' · '}{f.missing_checks} missing · {f.partial_checks} partial
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
        <button
          onClick={() => handleAction('approve')}
          disabled={action !== null}
          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {action === 'approve' ? 'Approving…' : 'Approve & Finalise'}
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={action !== null}
          className="flex-1 py-2.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 text-sm font-medium rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {action === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
    </div>
  )
}
