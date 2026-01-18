// src/lib/syncEngine.ts
import { createClient } from './supabase'
import * as supabaseStorage from './supabaseStorage'
import * as localStorage from './storage'
import { getSyncQueue, clearSyncQueue, saveSyncQueue, PendingChange } from './syncQueue'

export type SyncStatus = 'idle' | 'syncing' | 'error'

let syncStatus: SyncStatus = 'idle'
let statusCallbacks: ((status: SyncStatus, pending: number) => void)[] = []

/**
 * Subscribe to sync status changes
 */
export function onSyncStatusChange(callback: (status: SyncStatus, pending: number) => void) {
  statusCallbacks.push(callback)
  return () => {
    statusCallbacks = statusCallbacks.filter(cb => cb !== callback)
  }
}

/**
 * Notify all subscribers of status change
 */
function notifyStatusChange(status: SyncStatus, pendingCount: number = 0) {
  syncStatus = status
  statusCallbacks.forEach(cb => cb(status, pendingCount))
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated(): Promise<boolean> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Process pending changes and sync to Supabase
 */
export async function processSyncQueue(): Promise<boolean> {
  // Check if authenticated
  const authed = await isAuthenticated()
  if (!authed) {
    console.log('[Sync] Not authenticated, skipping sync')
    return false
  }

  const queue = getSyncQueue()
  if (queue.pendingChanges.length === 0) {
    console.log('[Sync] No pending changes')
    return true
  }

  console.log(`[Sync] Processing ${queue.pendingChanges.length} pending changes`)
  notifyStatusChange('syncing', queue.pendingChanges.length)

  const failedChanges: PendingChange[] = []

  // Process each change individually, tracking failures
  for (const change of queue.pendingChanges) {
    try {
      await processChange(change)
      console.log(`[Sync] ✓ ${change.type}`)
    } catch (error) {
      console.error(`[Sync] ✗ Failed to process ${change.type}:`, error)
      failedChanges.push(change)
    }
  }

  // If all succeeded, clear queue
  if (failedChanges.length === 0) {
    clearSyncQueue()
    console.log('[Sync] ✓ Successfully synced all changes')
    notifyStatusChange('idle', 0)
    return true
  } else {
    // Keep only failed changes in queue
    saveSyncQueue({ pendingChanges: failedChanges, lastSyncedAt: Date.now() })
    console.error(`[Sync] ✗ ${failedChanges.length} changes failed, will retry later`)
    notifyStatusChange('error', failedChanges.length)
    return false
  }
}

/**
 * Process a single change
 */
async function processChange(change: PendingChange): Promise<void> {
  try {
    switch (change.type) {
      case 'addSet':
        await supabaseStorage.addSupabaseSet(
          change.data.id, // Use existing ID from local
          change.data.name,
          change.data.parentId,
          change.data.description || ''
        )
        break

      case 'updateSet':
        await supabaseStorage.updateSupabaseSet(change.setId, change.updates)
        break

      case 'deleteSet':
        await supabaseStorage.deleteSupabaseSet(change.setId)
        break

      case 'addCard':
        await supabaseStorage.addSupabaseCard(
          change.data.id, // Use existing ID from local
          change.setId,
          change.data.term,
          change.data.definition
        )
        break

      case 'editCard':
        await supabaseStorage.editSupabaseCard(change.setId, change.data)
        break

      case 'deleteCard':
        await supabaseStorage.deleteSupabaseCard(change.setId, change.cardId)
        break

      case 'addFolder':
        await supabaseStorage.addSupabaseFolder(
          change.data.id, // Use existing ID from local
          change.data.name,
          change.data.parentId,
          change.data.description || ''
        )
        break

      case 'updateFolder':
        await supabaseStorage.updateSupabaseFolder(change.folderId, change.updates)
        break

      case 'deleteFolder':
        await supabaseStorage.deleteSupabaseFolder(change.folderId)
        break

      default:
        console.warn('[Sync] Unknown change type:', change)
    }
  } catch (error) {
    console.error('[Sync] Error processing change:', change, error)
    throw error
  }
}

/**
 * Pull latest data from Supabase and merge with local
 * Called on app startup
 */
export async function pullFromServer(): Promise<boolean> {
  const authed = await isAuthenticated()
  if (!authed) {
    console.log('[Sync] Not authenticated, skipping pull')
    return false
  }

  console.log('[Sync] Checking for server updates...')
  notifyStatusChange('syncing', 0)

  try {
    // Fetch from Supabase
    const remoteSets = await supabaseStorage.getSupabaseSets()
    const remoteFolders = await supabaseStorage.getSupabaseFolders()

    // Get current local data
    const localSets = localStorage.getSets()
    const localFolders = localStorage.getFolders()

    // Check if data is different
    const setsChanged = JSON.stringify(remoteSets) !== JSON.stringify(localSets)
    const foldersChanged = JSON.stringify(remoteFolders) !== JSON.stringify(localFolders)

    if (!setsChanged && !foldersChanged) {
      console.log('[Sync] No changes from server, skipping update')
      notifyStatusChange('idle', 0)
      return true
    }

    // Update local storage with remote data
    console.log('[Sync] Updating local data from server', {
      setsChanged,
      foldersChanged
    })
    localStorage.saveSets(remoteSets)
    localStorage.saveFolders(remoteFolders)

    console.log('[Sync] Successfully pulled data from server')
    notifyStatusChange('idle', 0)
    return true
  } catch (error) {
    console.error('[Sync] Error pulling from server:', error)
    notifyStatusChange('error', 0)
    return false
  }
}

/**
 * Sync on page unload (best-effort)
 */
export function syncOnUnload() {
  if (typeof window === 'undefined') return

  window.addEventListener('beforeunload', (e) => {
    const queue = getSyncQueue()
    if (queue.pendingChanges.length > 0) {
      // Use sendBeacon for best-effort delivery
      // Note: We can't do async work here, so we'll just trigger sync
      // The next app load will pick up any failed syncs
      processSyncQueue().catch(err => {
        console.error('[Sync] Error during unload sync:', err)
      })
    }
  })
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return syncStatus
}
