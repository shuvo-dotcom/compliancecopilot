import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface LockStore {
  locked: boolean
  lock: () => void
  unlock: () => void
}

export const useLock = create<LockStore>()(
  persist(
    set => ({
      locked: false,
      lock: () => set({ locked: true }),
      unlock: () => set({ locked: false }),
    }),
    {
      name: 'cc-lock',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
