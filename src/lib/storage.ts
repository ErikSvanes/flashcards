// src/lib/storage.ts
import { v4 as uuidv4 } from "uuid";

export interface Card {
  id: string;
  term: string;
  definition: string;
  termImage?: string;
  definitionImage?: string;
  isMarkdown?: boolean;
}

export interface Set {
  id: string;
  name: string;
  description?: string;
  cards: Card[];
  parentId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
}

export type FolderItem =
  | { type: "folder"; data: Folder }
  | { type: "set"; data: Set };

const STORAGE_KEY = "flashcards_sets";
const FOLDERS_KEY = "flashcards_folders";

/** Base get/save helpers */
export function getSets(): Set[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  const sets: Set[] = raw ? JSON.parse(raw) : [];

  // Migration: Add parentId to existing sets without it
  let needsSave = false;
  const migratedSets = sets.map(set => {
    if (!('parentId' in set)) {
      needsSave = true;
      return { ...set, parentId: null };
    }
    return set;
  });

  if (needsSave) {
    saveSets(migratedSets);
  }

  return migratedSets;
}

export function saveSets(sets: Set[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

/** ---- SET HELPERS ---- **/

export function addSet(name: string, parentId: string | null, description = ""): Set {
  const sets = getSets();
  const newSet: Set = {
    id: uuidv4(),
    name,
    description,
    cards: [],
    parentId,
  };
  const updatedSets = [...sets, newSet];
  saveSets(updatedSets);
  return newSet;
}

export function updateSet(setId: string, updates: Partial<Set>) {
  const sets = getSets();
  const updatedSets = sets.map(s =>
    s.id === setId ? { ...s, ...updates } : s
  );
  saveSets(updatedSets);
}

export function deleteSet(setId: string) {
  const updatedSets = getSets().filter((s) => s.id !== setId);
  saveSets(updatedSets);
}

/** ---- CARD HELPERS ---- **/

export function addCard(
  setId: string,
  term: string,
  definition: string
): Card | null {
  const sets = getSets();
  const targetSet = sets.find((s) => s.id === setId);
  if (!targetSet) return null;

  const newCard: Card = {
    id: uuidv4(),
    term,
    definition,
  };

  targetSet.cards.push(newCard);
  saveSets(sets);
  return newCard;
}

export function editCard(setId: string, updatedCard: Card) {
  const sets = getSets();
  const targetSet = sets.find((s) => s.id === setId);
  if (!targetSet) return;

  targetSet.cards = targetSet.cards.map((c) =>
    c.id === updatedCard.id ? updatedCard : c
  );

  saveSets(sets);
}

export function deleteCard(setId: string, cardId: string) {
  const sets = getSets();
  const targetSet = sets.find((s) => s.id === setId);
  if (!targetSet) return;

  targetSet.cards = targetSet.cards.filter((c) => c.id !== cardId);
  saveSets(sets);
}

/** ---- SESSION HELPERS ---- **/

import { StudySession } from "./studyTypes";

const SESSIONS_KEY = "flashcard_sessions";

interface SessionStorage {
  [setId: string]: StudySession;
}

/**
 * Get all sessions from localStorage
 */
function getAllSessions(): SessionStorage {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(SESSIONS_KEY);
  return raw ? JSON.parse(raw) : {};
}

/**
 * Save all sessions to localStorage
 */
function saveAllSessions(sessions: SessionStorage) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

/**
 * Get session for a specific set
 */
export function getSession(setId: string): StudySession | null {
  const sessions = getAllSessions();
  return sessions[setId] || null;
}

/**
 * Save session for a specific set
 */
export function saveSession(setId: string, session: StudySession) {
  const sessions = getAllSessions();
  sessions[setId] = session;
  saveAllSessions(sessions);
}

/**
 * Clear session for a specific set
 * If the session is infinite mode with multiple sets, clears from all linked sets
 */
export function clearSession(setId: string) {
  const sessions = getAllSessions();
  const session = sessions[setId];

  // If it's an infinite mode session with multiple sets, clear from all of them
  if (session?.mode === "infinite" && session.settings?.selectedSetIds) {
    session.settings.selectedSetIds.forEach((id: string) => {
      delete sessions[id];
    });
  } else {
    // Just clear the single set
    delete sessions[setId];
  }

  saveAllSessions(sessions);
}

/** ---- FOLDER HELPERS ---- **/

/**
 * Get all folders from localStorage
 */
export function getFolders(): Folder[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FOLDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Save all folders to localStorage
 */
export function saveFolders(folders: Folder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

/**
 * Add a new folder
 */
export function addFolder(
  name: string,
  parentId: string | null,
  description = ""
): Folder {
  const folders = getFolders();
  const newFolder: Folder = {
    id: uuidv4(),
    name,
    description,
    parentId,
  };
  saveFolders([...folders, newFolder]);
  return newFolder;
}

/**
 * Update a folder
 */
export function updateFolder(folderId: string, updates: Partial<Folder>) {
  const folders = getFolders();
  const updatedFolders = folders.map(f =>
    f.id === folderId ? { ...f, ...updates } : f
  );
  saveFolders(updatedFolders);
}

/**
 * Get folder by ID
 */
export function getFolderById(folderId: string): Folder | null {
  return getFolders().find(f => f.id === folderId) || null;
}

/**
 * Check if a folder is a descendant of another folder (for circular reference prevention)
 */
export function isDescendant(
  potentialDescendant: string | null,
  ancestorId: string
): boolean {
  if (!potentialDescendant) return false;
  let current = potentialDescendant;
  const folders = getFolders();

  while (current) {
    if (current === ancestorId) return true;
    const folder = folders.find(f => f.id === current);
    current = folder?.parentId || null;
  }
  return false;
}

/**
 * Delete a folder and optionally cascade delete all descendants
 */
export function deleteFolder(folderId: string, cascade = true) {
  if (cascade) {
    deleteDescendants(folderId);
  }
  const folders = getFolders().filter(f => f.id !== folderId);
  saveFolders(folders);
}

/**
 * Helper to recursively delete all descendants of a folder
 */
function deleteDescendants(folderId: string) {
  const folders = getFolders();
  const sets = getSets();

  // Find all child folders recursively
  const childFolders = folders.filter(f => f.parentId === folderId);
  childFolders.forEach(child => deleteDescendants(child.id));

  // Delete child sets and their sessions
  const childSets = sets.filter(s => s.parentId === folderId);
  childSets.forEach(set => {
    deleteSet(set.id);
    clearSession(set.id);
  });

  // Delete child folders
  const remainingFolders = getFolders().filter(f => f.parentId !== folderId);
  saveFolders(remainingFolders);
}

/**
 * Move an item (folder or set) to a new parent
 */
export function moveItem(
  itemId: string,
  newParentId: string | null,
  itemType: "folder" | "set"
) {
  if (itemType === "folder") {
    // Check for circular reference
    if (newParentId && isDescendant(newParentId, itemId)) {
      throw new Error("Cannot move folder into its own descendant");
    }
    updateFolder(itemId, { parentId: newParentId });
  } else {
    updateSet(itemId, { parentId: newParentId });
  }
}

/**
 * Get all items (folders and sets) in a specific folder
 */
export function getItemsInFolder(folderId: string | null): FolderItem[] {
  const folders = getFolders().filter(f => f.parentId === folderId);
  const sets = getSets().filter(s => s.parentId === folderId);

  const folderItems: FolderItem[] = folders.map(f => ({
    type: "folder",
    data: f,
  }));
  const setItems: FolderItem[] = sets.map(s => ({ type: "set", data: s }));

  // Sort: folders first, then sets, alphabetically within each type
  return [...folderItems, ...setItems].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.data.name.localeCompare(b.data.name);
  });
}

/**
 * Get the folder path from root to a specific folder (for breadcrumbs)
 */
export function getFolderPath(folderId: string | null): Folder[] {
  if (!folderId) return [];

  const path: Folder[] = [];
  let current: string | null = folderId;
  const folders = getFolders();

  while (current) {
    const folder = folders.find(f => f.id === current);
    if (folder) {
      path.unshift(folder);
      current = folder.parentId;
    } else {
      break;
    }
  }

  return path;
}
