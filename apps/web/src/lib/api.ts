// Every API request injects the LLM key as a header.
// The key never touches your server's DB.

import { useLLMKey } from '@/store/llmKey'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiKey, model } = useLLMKey.getState()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Inject LLM key per-request. Never stored server-side.
  if (apiKey) {
    headers['X-LLM-Key'] = apiKey
    headers['X-LLM-Model'] = model
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }

  return res.json()
}

export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const { apiKey, model } = useLLMKey.getState()

  const headers: Record<string, string> = {}
  if (apiKey) {
    headers['X-LLM-Key'] = apiKey
    headers['X-LLM-Model'] = model
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(error.detail || 'Upload failed')
  }

  return res.json()
}
