'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerPasskey } from '@/lib/webauthn'

export default function PasskeyRegister() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError(null)
    try {
      await registerPasskey(username.trim())
      router.push('/settings')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <p className="text-sm text-gray-600 text-center">
        Create an account secured by your device passkey. No password needed.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="e.g. alice"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          required
          minLength={2}
          maxLength={64}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !username.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
      >
        {loading ? (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )}
        {loading ? 'Registering…' : 'Create Account'}
      </button>
    </form>
  )
}
