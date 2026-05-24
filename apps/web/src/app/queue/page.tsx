'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useLock } from '@/store/lock'
import type { Job } from '@/types'
import ApprovalCard from '@/components/queue/ApprovalCard'

export default function QueuePage() {
  const router = useRouter()
  const lock = useLock(s => s.lock)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchQueue() {
    try {
      const data = await apiRequest<Job[]>('/queue/')
      setJobs(data)
    } catch {
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQueue() }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">← Dashboard</Link>
        <h1 className="text-base font-semibold text-gray-900">Human Review Queue</h1>
        <button onClick={lock} title="Lock screen" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500 mb-6">
          Reports must be approved by a human before they can be exported. Review each finding before approving.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-36 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            No reports pending review.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <ApprovalCard key={job.id} job={job} onAction={fetchQueue} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
