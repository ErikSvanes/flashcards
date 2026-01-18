// src/lib/hybridStorage.ts
import { createClient } from './supabase'
import { Set, Card, Folder, FolderItem } from './storage'
import * as localStorage from './storage'
import { queueChange } from './syncQueue'
import { v4 as uuidv4 } from 'uuid'

/**
 * Check if user is authenticated
 */
async function isAuthenticated(): Promise<boolean> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/** ---- HYBRID SET HELPERS ---- **/

export async function getSets(): Promise<Set[]> {
  // Always read from localStorage (fast)
  return localStorage.getSets()
}

export async function addSet(name: string, parentId: string | null, description = ''): Promise<Set> {
  // Generate UUID on client
  const id = uuidv4()

  const newSet: Set = {
    id,
    name,
    description,
    parentId,
    cards: []
  }

  // Write to localStorage immediately (instant UI)
  const sets = localStorage.getSets()
  sets.push(newSet)
  localStorage.saveSets(sets)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    queueChange({ type: 'addSet', data: newSet })
  }

  return newSet
}

export async function updateSet(setId: string, updates: Partial<Set>): Promise<void> {
  // Write to localStorage first
  localStorage.updateSet(setId, updates)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    queueChange({ type: 'updateSet', setId, updates })
  }
}

export async function deleteSet(setId: string): Promise<void> {
  // Write to localStorage first
  localStorage.deleteSet(setId)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    queueChange({ type: 'deleteSet', setId })
  }
}

/** ---- HYBRID CARD HELPERS ---- **/

export async function addCard(
  setId: string,
  term: string,
  definition: string
): Promise<Card | null> {
  // Generate UUID on client
  const id = uuidv4()

  const newCard: Card = {
    id,
    term,
    definition
  }

  // Write to localStorage immediately
  const sets = localStorage.getSets()
  const targetSet = sets.find(s => s.id === setId)
  if (!targetSet) return null

  targetSet.cards.push(newCard)
  localStorage.saveSets(sets)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    queueChange({ type: 'addCard', setId, data: newCard })
  }

  return newCard
}

export async function editCard(setId: string, updatedCard: Card): Promise<void> {
  // Write to localStorage first
  localStorage.editCard(setId, updatedCard)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    queueChange({ type: 'editCard', setId, data: updatedCard })
  }
}

export async function deleteCard(setId: string, cardId: string): Promise<void> {
  // Write to localStorage first
  localStorage.deleteCard(setId, cardId)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    queueChange({ type: 'deleteCard', setId, cardId })
  }
}

/** ---- HYBRID FOLDER HELPERS ---- **/

export async function getFolders(): Promise<Folder[]> {
  // Always read from localStorage
  return localStorage.getFolders()
}

export async function addFolder(
  name: string,
  parentId: string | null,
  description = ''
): Promise<Folder> {
  // Generate UUID on client
  const id = uuidv4()

  const newFolder: Folder = {
    id,
    name,
    description,
    parentId
  }

  // Write to localStorage immediately
  const folders = localStorage.getFolders()
  folders.push(newFolder)
  localStorage.saveFolders(folders)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    queueChange({ type: 'addFolder', data: newFolder })
  }

  return newFolder
}

export async function updateFolder(folderId: string, updates: Partial<Folder>): Promise<void> {
  // Write to localStorage first
  localStorage.updateFolder(folderId, updates)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    queueChange({ type: 'updateFolder', folderId, updates })
  }
}

export async function deleteFolder(folderId: string, cascade = true): Promise<void> {
  // Write to localStorage first
  localStorage.deleteFolder(folderId, cascade)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    queueChange({ type: 'deleteFolder', folderId })
  }
}

export async function getFolderById(folderId: string): Promise<Folder | null> {
  return localStorage.getFolderById(folderId)
}

export async function moveItem(
  itemId: string,
  newParentId: string | null,
  itemType: 'folder' | 'set'
): Promise<void> {
  // Check for circular reference first
  if (itemType === 'folder' && newParentId) {
    if (await isDescendant(newParentId, itemId)) {
      throw new Error('Cannot move folder into its own descendant')
    }
  }

  // Write to localStorage first
  localStorage.moveItem(itemId, newParentId, itemType)

  // Queue for batched sync if authenticated
  if (await isAuthenticated()) {
    if (itemType === 'folder') {
      queueChange({ type: 'updateFolder', folderId: itemId, updates: { parentId: newParentId } })
    } else {
      queueChange({ type: 'updateSet', setId: itemId, updates: { parentId: newParentId } })
    }
  }
}

export async function isDescendant(
  potentialDescendant: string | null,
  ancestorId: string
): Promise<boolean> {
  return localStorage.isDescendant(potentialDescendant, ancestorId)
}

export async function getItemsInFolder(folderId: string | null): Promise<FolderItem[]> {
  return localStorage.getItemsInFolder(folderId)
}

export async function getFolderPath(folderId: string | null): Promise<Folder[]> {
  return localStorage.getFolderPath(folderId)
}

/** ---- SESSION HELPERS (always localStorage) ---- **/

export function getSession(setId: string) {
  return localStorage.getSession(setId)
}

export function saveSession(setId: string, session: any) {
  return localStorage.saveSession(setId, session)
}

export function clearSession(setId: string) {
  return localStorage.clearSession(setId)
}
