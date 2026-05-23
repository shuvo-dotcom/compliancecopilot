'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import type { Job } from '@/types'
import GapReport from '@/components/report/GapReport'
import AgentProgress from '@/components/jobs/AgentProgress'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (!job) return null

  const frameworkLabel = job.framework === 'gdpr' ? 'GDPR' : 'EU AI Act'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">← Dashboard</Link>
        <h1 className="text-base font-semibold text-gray-900 truncate max-w-sm">{job.document_name}</h1>
        <span className="text-xs text-gray-500">{frameworkLabel}</span>
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
