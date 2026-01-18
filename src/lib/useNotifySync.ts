// src/lib/useNotifySync.ts
'use client'

import { useEffect } from 'react'

/**
 * Hook to notify sync manager when component makes changes
 * Import this in components that use hybridStorage functions
 * Call notifySync() after making changes to trigger debounced sync
 */
export function useNotifySync() {
  useEffect(() => {
    // Listen for storage events to trigger sync
    const handleStorageChange = () => {
      // Dispatch custom event to notify sync manager
      window.dispatchEvent(new CustomEvent('flashcards:datachange'))
    }

    // We'll manually trigger this from components
    window.addEventListener('flashcards:datachange', handleStorageChange)

    return () => {
      window.removeEventListener('flashcards:datachange', handleStorageChange)
    }
  }, [])

  return {
    notifySync: () => {
      window.dispatchEvent(new CustomEvent('flashcards:datachange'))
    }
  }
}
