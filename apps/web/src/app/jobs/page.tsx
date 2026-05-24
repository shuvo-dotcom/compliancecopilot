'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useLock } from '@/store/lock'
import type { Job } from '@/types'
import JobCard from '@/components/jobs/JobCard'

export default function JobsPage() {
  const router = useRouter()
  const lock = useLock(s => s.lock)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest<Job[]>('/jobs/')
      .then(setJobs)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">← Dashboard</Link>
        <h1 className="text-base font-semibold text-gray-900">All Jobs</h1>
        <button onClick={lock} title="Lock screen" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </main>
    </div>
  )
}
