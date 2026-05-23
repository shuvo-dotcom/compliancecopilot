'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import type { Job } from '@/types'
import JobCard from '@/components/jobs/JobCard'

export default function JobsPage() {
  const router = useRouter()
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
        <div />
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
