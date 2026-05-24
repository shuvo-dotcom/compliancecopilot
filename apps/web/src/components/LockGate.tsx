'use client'

import { useLock } from '@/store/lock'
import LockScreen from './LockScreen'

export default function LockGate({ children }: { children: React.ReactNode }) {
  const locked = useLock(s => s.locked)
  return (
    <>
      {locked && <LockScreen />}
      {children}
    </>
  )
}
