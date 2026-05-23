import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function registerPasskey(username: string): Promise<void> {
  const optionsRes = await fetch(`${BASE_URL}/auth/register/begin`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  if (!optionsRes.ok) throw new Error('Failed to begin registration')
  const options = await optionsRes.json()

  const credential = await startRegistration(options)

  const verifyRes = await fetch(`${BASE_URL}/auth/register/complete`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credential),
  })
  if (!verifyRes.ok) {
    const err = await verifyRes.json()
    throw new Error(err.detail || 'Registration failed')
  }
}

export async function authenticatePasskey(): Promise<void> {
  const optionsRes = await fetch(`${BASE_URL}/auth/login/begin`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!optionsRes.ok) throw new Error('Failed to begin authentication')
  const options = await optionsRes.json()

  const credential = await startAuthentication(options)

  const verifyRes = await fetch(`${BASE_URL}/auth/login/complete`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credential),
  })
  if (!verifyRes.ok) {
    const err = await verifyRes.json()
    throw new Error(err.detail || 'Authentication failed')
  }
}
