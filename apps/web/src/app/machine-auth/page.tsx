'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

function MachineAuth() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setError('No token provided.')
      return
    }

    fetch(`${BASE_URL}/auth/redeem-machine-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.detail || 'Authentication failed')
        }
        router.replace('/dashboard')
      })
      .catch(e => setError(e.message))
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => router.push('/')} className="text-sky-400 text-sm underline">
            Go to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <svg className="animate-spin w-10 h-10 text-sky-500 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-slate-400 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}

export default function MachineAuthPage() {
  return (
    <Suspense>
      <MachineAuth />
    </Suspense>
  )
}
