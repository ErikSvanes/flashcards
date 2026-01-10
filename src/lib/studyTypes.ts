// src/lib/studyTypes.ts
import { Card } from "./storage";

export type StudyMode = "standard" | "infinite" | "grouped";
export type CardOrientation = "term-first" | "definition-first";

export interface StudySettings {
  mode: StudyMode;
  shuffle: boolean;
  orientation: CardOrientation;
  selectedSetIds?: string[]; // For infinite mode - multiple sets
}

// Card types with mode-specific metadata
export interface StandardCard extends Card {
  flipped: boolean;
  inDontKnowPile: boolean;
}

export interface InfiniteCard extends Card {
  flipped: boolean;
  confidenceScore: number; // Running average of ratings (1-3)
  timesRated: number; // Track how many times rated for average calculation
}

export interface GroupedCard extends Card {
  flipped: boolean;
  groupIndex: number; // Which group (0-based) this card belongs to
  consecutiveCorrect: number; // 0-2, tracks streak of correct answers
}

// Session state for each mode
export interface StandardSession {
  mode: "standard";
  settings: StudySettings;
  cards: StandardCard[];
  currentIndex: number;
  dontKnowPile: StandardCard[];
  timestamp: number;
}

export interface InfiniteSession {
  mode: "infinite";
  settings: StudySettings;
  cards: InfiniteCard[];
  currentIndex: number;
  totalCardsStudied: number;
  timestamp: number;
}

export interface GroupedSession {
  mode: "grouped";
  settings: StudySettings;
  allGroups: GroupedCard[][]; // All groups of cards
  currentGroupIndex: number;
  currentCards: GroupedCard[]; // Current group + review cards
  currentIndex: number;
  dontKnowPile: GroupedCard[];
  reviewPool: GroupedCard[]; // Cards from previous groups still being reviewed
  lastDisplayedCardId?: string; // Track which card was last shown for resume
  timestamp: number;
}

export type StudySession = StandardSession | InfiniteSession | GroupedSession;
