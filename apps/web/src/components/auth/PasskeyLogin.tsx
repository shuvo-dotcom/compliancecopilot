'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticatePasskey } from '@/lib/webauthn'

export default function PasskeyLogin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    try {
      await authenticatePasskey()
      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 text-center">
        Use your device passkey (Touch ID, Face ID, or security key) to sign in.
      </p>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
      >
        {loading ? (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        )}
        {loading ? 'Authenticating…' : 'Sign in with Passkey'}
      </button>
    </div>
  )
}
