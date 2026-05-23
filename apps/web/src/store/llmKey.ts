// Session-only LLM key store.
// Persisted to sessionStorage so it survives in-tab navigation.
// Cleared automatically when the tab/browser is closed.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface LLMKeyStore {
  apiKey: string | null
  model: string
  setKey: (key: string, model: string) => void
  clearKey: () => void
  isConfigured: () => boolean
}

export const useLLMKey = create<LLMKeyStore>()(
  persist(
    (set, get) => ({
      apiKey: null,
      model: 'gpt-4o',
      setKey: (key, model) => set({ apiKey: key, model }),
      clearKey: () => set({ apiKey: null }),
      isConfigured: () => get().apiKey !== null,
    }),
    {
      name: 'llm-key',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
