// src/lib/useSyncManager.ts
'use client'

import { useEffect, useState, useRef } from 'react'
import { processSyncQueue, pullFromServer, onSyncStatusChange, SyncStatus } from './syncEngine'
import { getPendingCount } from './syncQueue'
import { createClient } from './supabase'

const SYNC_DELAY_MS = 30000 // 30 seconds

export function useSyncManager() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout>()
  const hasInitialSyncRef = useRef(false)

  // Subscribe to sync status changes and poll pending count
  useEffect(() => {
    const unsubscribe = onSyncStatusChange((status, pending) => {
      setSyncStatus(status)
      setPendingCount(pending)
    })

    // Also update pending count periodically to catch any changes
    const intervalId = setInterval(() => {
      const currentPending = getPendingCount()
      setPendingCount(currentPending)
    }, 1000) // Check every second

    return () => {
      unsubscribe()
      clearInterval(intervalId)
    }
  }, [])

  // Check auth status and pull on startup
  useEffect(() => {
    const supabase = createClient()

    // Check initial auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authed = !!session
      setIsAuthenticated(authed)

      // Pull from server on startup if authenticated
      if (authed && !hasInitialSyncRef.current) {
        hasInitialSyncRef.current = true
        console.log('[SyncManager] App started, pulling from server...')
        pullFromServer()
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authed = !!session
      setIsAuthenticated(authed)

      // Don't pull from server on sign-in - let the user sync their local data first
      // Pulling happens on app startup instead
    })

    return () => subscription.unsubscribe()
  }, [])

  // Debounced sync trigger
  const triggerSync = () => {
    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Update pending count
    const pending = getPendingCount()
    setPendingCount(pending)

    // Only schedule sync if authenticated and have pending changes
    if (!isAuthenticated || pending === 0) return

    // Schedule sync after delay
    syncTimeoutRef.current = setTimeout(() => {
      console.log('[SyncManager] Inactivity timeout reached, syncing...')
      processSyncQueue()
    }, SYNC_DELAY_MS)
  }

  // Listen for data changes to trigger sync
  useEffect(() => {
    const handleDataChange = () => {
      triggerSync()
    }

    window.addEventListener('flashcards:datachange', handleDataChange)
    return () => window.removeEventListener('flashcards:datachange', handleDataChange)
  }, [isAuthenticated])

  // Page unload sync
  useEffect(() => {
    const handleUnload = () => {
      const pending = getPendingCount()
      if (pending > 0 && isAuthenticated) {
        console.log('[SyncManager] Page unload, syncing...')
        // Use keepalive fetch for best-effort delivery
        processSyncQueue()
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [isAuthenticated])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  return {
    syncStatus,
    pendingCount,
    isAuthenticated,
    triggerSync,
    manualSync: processSyncQueue,
  }
}
