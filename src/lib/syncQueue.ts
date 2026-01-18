// src/lib/syncQueue.ts
import { Set, Card, Folder } from './storage'

export type PendingChange =
  | { type: 'addSet'; data: Set }
  | { type: 'updateSet'; setId: string; updates: Partial<Set> }
  | { type: 'deleteSet'; setId: string }
  | { type: 'addCard'; setId: string; data: Card }
  | { type: 'editCard'; setId: string; data: Card }
  | { type: 'deleteCard'; setId: string; cardId: string }
  | { type: 'addFolder'; data: Folder }
  | { type: 'updateFolder'; folderId: string; updates: Partial<Folder> }
  | { type: 'deleteFolder'; folderId: string }

interface SyncQueueData {
  pendingChanges: PendingChange[]
  lastSyncedAt: number | null
}

const SYNC_QUEUE_KEY = 'flashcards_sync_queue'

/**
 * Get the sync queue from localStorage
 */
export function getSyncQueue(): SyncQueueData {
  if (typeof window === 'undefined') return { pendingChanges: [], lastSyncedAt: null }
  const raw = localStorage.getItem(SYNC_QUEUE_KEY)
  if (!raw) return { pendingChanges: [], lastSyncedAt: null }
  return JSON.parse(raw)
}

/**
 * Save the sync queue to localStorage
 */
export function saveSyncQueue(queue: SyncQueueData) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
}

/**
 * Add a pending change to the queue with smart deduplication
 */
export function queueChange(change: PendingChange) {
  const queue = getSyncQueue()

  // Deduplicate: remove previous edits/updates for the same item
  let dedupedChanges = queue.pendingChanges.filter(existingChange => {
    // Keep different types of changes
    if (existingChange.type !== change.type) return true

    // Deduplicate editCard - only keep the latest for each card
    if (change.type === 'editCard' && existingChange.type === 'editCard') {
      return !(existingChange.setId === change.setId && existingChange.data.id === change.data.id)
    }

    // Deduplicate updateSet - only keep the latest for each set
    if (change.type === 'updateSet' && existingChange.type === 'updateSet') {
      return existingChange.setId !== change.setId
    }

    // Deduplicate updateFolder - only keep the latest for each folder
    if (change.type === 'updateFolder' && existingChange.type === 'updateFolder') {
      return existingChange.folderId !== change.folderId
    }

    return true
  })

  // Advanced optimization: merge addCard + editCard into single addCard
  if (change.type === 'editCard') {
    const addIndex = dedupedChanges.findIndex(c =>
      c.type === 'addCard' && c.setId === change.setId && c.data.id === change.data.id
    )

    if (addIndex !== -1) {
      // Replace the addCard with updated data instead of adding editCard
      dedupedChanges[addIndex] = {
        type: 'addCard',
        setId: change.setId,
        data: change.data
      }
      queue.pendingChanges = dedupedChanges
      saveSyncQueue(queue)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('flashcards:datachange'))
      }
      return
    }
  }

  // Add the new change
  dedupedChanges.push(change)
  queue.pendingChanges = dedupedChanges

  console.log(`[Queue] Added ${change.type}, queue size: ${dedupedChanges.length}`)

  saveSyncQueue(queue)

  // Notify sync manager of data change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flashcards:datachange'))
  }
}

/**
 * Clear all pending changes (after successful sync)
 */
export function clearSyncQueue() {
  saveSyncQueue({ pendingChanges: [], lastSyncedAt: Date.now() })
}

/**
 * Get count of pending changes
 */
export function getPendingCount(): number {
  return getSyncQueue().pendingChanges.length
}

/**
 * Check if there are pending changes
 */
export function hasPendingChanges(): boolean {
  return getPendingCount() > 0
}
