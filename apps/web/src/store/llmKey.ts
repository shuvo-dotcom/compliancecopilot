// Session-only LLM key store.
// Never persisted to localStorage, sessionStorage, cookies, or anywhere.
// Cleared automatically when tab closes.

import { create } from 'zustand'

interface LLMKeyStore {
  apiKey: string | null
  model: string
  setKey: (key: string, model: string) => void
  clearKey: () => void
  isConfigured: () => boolean
}

export const useLLMKey = create<LLMKeyStore>((set, get) => ({
  apiKey: null,
  model: 'gpt-4o',
  setKey: (key, model) => set({ apiKey: key, model }),
  clearKey: () => set({ apiKey: null }),
  isConfigured: () => get().apiKey !== null,
}))
