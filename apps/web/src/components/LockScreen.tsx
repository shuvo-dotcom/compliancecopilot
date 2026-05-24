'use client'

import { useState, useEffect } from 'react'
import { useLock } from '@/store/lock'
import { authenticatePasskey } from '@/lib/webauthn'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

function isWKWebView(): boolean {
  if (typeof navigator === 'undefined') return false
  // WKWebView UA contains "AppleWebKit" but NOT "Safari" at the end,
  // and our app injects no custom UA token — this is the reliable heuristic.
  const ua = navigator.userAgent
  return /AppleWebKit/.test(ua) && !/Chrome/.test(ua) && !/Firefox/.test(ua) && !/Safari\/\d/.test(ua)
}

async function unlockViaMachineToken(): Promise<void> {
  const tokenRes = await fetch(`${BASE_URL}/auth/machine-token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!tokenRes.ok) throw new Error('Could not generate unlock token')
  const { token } = await tokenRes.json()

  const redeemRes = await fetch(`${BASE_URL}/auth/redeem-machine-token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!redeemRes.ok) throw new Error('Unlock token invalid or expired')
}

export default function LockScreen() {
  const unlock = useLock(s => s.unlock)
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inMacApp, setInMacApp] = useState(false)

  useEffect(() => {
    setInMacApp(isWKWebView())
    function tick() {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setDate(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  async function handleUnlock() {
    setError('')
    setLoading(true)
    try {
      if (inMacApp) {
        await unlockViaMachineToken()
      } else {
        await authenticatePasskey()
      }
      unlock()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unlock failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center select-none">
      <div className="flex flex-col items-center gap-2 mb-16">
        <p className="text-slate-400 text-lg">{date}</p>
        <p className="text-white text-8xl font-thin tabular-nums tracking-tight">{time}</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <button
          onClick={handleUnlock}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-full text-sm font-medium transition-colors"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          )}
          {inMacApp ? 'Unlock' : 'Unlock with Passkey'}
        </button>

        {error && <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>}
      </div>

      <div className="absolute bottom-8 flex items-center gap-2 text-slate-600 text-xs">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        ComplianceCopilot
      </div>
    </div>
  )
}
