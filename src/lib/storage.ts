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
}

const STORAGE_KEY = "flashcards_sets";

/** Base get/save helpers */
export function getSets(): Set[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveSets(sets: Set[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

/** ---- SET HELPERS ---- **/

export function addSet(name: string, description = ""): Set {
  const sets = getSets();
  const newSet: Set = {
    id: uuidv4(),
    name,
    description,
    cards: [],
  };
  const updatedSets = [...sets, newSet];
  saveSets(updatedSets);
  return newSet;
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
