// src/lib/syncStorage.ts
import * as localStorage from './storage'
import * as supabaseStorage from './supabaseStorage'

/**
 * Check if user has local data that could be synced
 */
export function hasLocalData(): boolean {
  const sets = localStorage.getSets()
  const folders = localStorage.getFolders()
  return sets.length > 0 || folders.length > 0
}

/**
 * Sync local data to Supabase
 * Returns true if successful, false otherwise
 */
export async function syncLocalToSupabase(): Promise<boolean> {
  try {
    const localSets = localStorage.getSets()
    const localFolders = localStorage.getFolders()

    // First, sync folders (need to do this in order to maintain hierarchy)
    // Sort folders so parents come before children
    const sortedFolders = sortFoldersByHierarchy(localFolders)

    for (const folder of sortedFolders) {
      // Use the existing local ID to maintain consistency
      await supabaseStorage.addSupabaseFolder(
        folder.id, // Keep same ID
        folder.name,
        folder.parentId,
        folder.description || ''
      )
    }

    // Sync sets with their existing IDs
    for (const set of localSets) {
      await supabaseStorage.addSupabaseSet(
        set.id, // Keep same ID
        set.name,
        set.parentId,
        set.description || ''
      )

      // Now add cards for this set with their existing IDs
      for (const card of set.cards) {
        const newCard = await supabaseStorage.addSupabaseCard(
          card.id, // Keep same ID
          set.id,
          card.term,
          card.definition
        )

        // If card has images or markdown, update it
        if (newCard && (card.termImage || card.definitionImage || card.isMarkdown)) {
          await supabaseStorage.editSupabaseCard(set.id, {
            ...newCard,
            termImage: card.termImage,
            definitionImage: card.definitionImage,
            isMarkdown: card.isMarkdown,
          })
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error syncing to Supabase:', error)
    return false
  }
}

/**
 * Clear local storage after successful sync
 */
export function clearLocalData(): void {
  localStorage.saveSets([])
  localStorage.saveFolders([])
}

/**
 * Sort folders by hierarchy so parents come before children
 */
function sortFoldersByHierarchy(folders: any[]): any[] {
  const result: any[] = []
  const remaining = [...folders]
  const processed = new Set<string>()

  // Add root folders first
  const rootFolders = remaining.filter(f => !f.parentId)
  result.push(...rootFolders)
  rootFolders.forEach(f => processed.add(f.id))

  // Keep processing until all folders are added
  while (result.length < folders.length) {
    const batch = remaining.filter(
      f => !processed.has(f.id) && (!f.parentId || processed.has(f.parentId))
    )

    if (batch.length === 0) {
      // If we can't make progress, just add remaining folders
      const rest = remaining.filter(f => !processed.has(f.id))
      result.push(...rest)
      break
    }

    result.push(...batch)
    batch.forEach(f => processed.add(f.id))
  }

  return result
}
