'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSyncManager } from '@/lib/useSyncManager'
import { SyncStatus } from '@/lib/syncEngine'

interface SyncContextType {
  syncStatus: SyncStatus
  pendingCount: number
  isAuthenticated: boolean
  triggerSync: () => void
  manualSync: () => Promise<boolean>
}

const SyncContext = createContext<SyncContextType | null>(null)

export function SyncProvider({ children }: { children: ReactNode }) {
  const syncManager = useSyncManager()

  return (
    <SyncContext.Provider value={syncManager}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSyncContext() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider')
  }
  return context
}
