'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useLLMKey } from '@/store/llmKey'
import { useLock } from '@/store/lock'
import type { Job } from '@/types'
import GapReport from '@/components/report/GapReport'
import AgentProgress from '@/components/jobs/AgentProgress'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const lock = useLock(s => s.lock)
  const { apiKey, model } = useLLMKey()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  async function fetchJob() {
    try {
      const data = await apiRequest<Job>(`/jobs/${id}`)
      setJob(data)
    } catch {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJob()
    const interval = setInterval(() => {
      if (job?.status === 'running' || job?.status === 'queued') {
        fetchJob()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [id, job?.status])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-sky-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  async function downloadPdf() {
    if (!job) return
    setExporting(true)
    try {
      const headers: Record<string, string> = {}
      if (apiKey) { headers['X-LLM-Key'] = apiKey; headers['X-LLM-Model'] = model }
      const res = await fetch(`${BASE_URL}/jobs/${id}/export/pdf`, { credentials: 'include', headers })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-report-${id.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (!job) return null

  const frameworkLabel = job.framework === 'gdpr' ? 'GDPR' : 'EU AI Act'
  const canExport = job.status === 'approved' || job.status === 'awaiting_review'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">← Dashboard</Link>
        <h1 className="text-base font-semibold text-gray-900 truncate max-w-sm">{job.document_name}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{frameworkLabel}</span>
          {canExport && (
            <button
              onClick={downloadPdf}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
          )}
          <button onClick={lock} title="Lock screen" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {(job.status === 'running' || job.status === 'queued') && (
          <div className="mb-6">
            <AgentProgress status={job.status} />
          </div>
        )}

        {job.findings && (
          <GapReport report={job.findings} />
        )}

        {job.status === 'failed' && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 space-y-1">
            <p className="font-medium">Analysis failed</p>
            <p className="text-sm">{job.error_message || 'Please check your LLM key and model, then resubmit.'}</p>
          </div>
        )}
      </main>
    </div>
  )
}
