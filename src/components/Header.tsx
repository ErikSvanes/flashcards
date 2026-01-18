'use client'

import AuthButton from './AuthButton'
import { PAGE_MAX_WIDTH } from '@/lib/constants'
import Link from 'next/link'
import { useSyncContext } from './SyncProvider'

function SyncIndicator() {
  const { syncStatus, pendingCount, isAuthenticated } = useSyncContext()

  // Log pending count to console for debugging
  if (pendingCount > 0) {
    console.log(`[Sync] ${pendingCount} changes pending`)
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex items-center gap-2 text-sm">
      {syncStatus === 'syncing' && (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Syncing...</span>
        </div>
      )}
      {syncStatus === 'idle' && (
        <div className="flex items-center gap-2 text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Synced</span>
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>Sync error</span>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 py-4 sticky top-0 z-10">
      <div className={`${PAGE_MAX_WIDTH} mx-auto px-6 flex items-center justify-between`}>
        <Link href="/" className="text-xl font-bold hover:text-blue-600 transition">
          Flashcards
        </Link>
        <div className="flex items-center gap-4">
          <SyncIndicator />
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
