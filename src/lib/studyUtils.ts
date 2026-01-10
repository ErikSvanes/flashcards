// src/lib/studyUtils.ts
import { Card } from "./storage";
import { InfiniteCard, GroupedCard } from "./studyTypes";

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleCards<T extends Card>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Split cards into groups of specified size
 */
export function chunkCards<T extends Card>(cards: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < cards.length; i += size) {
    chunks.push(cards.slice(i, i + size));
  }
  return chunks;
}

/**
 * Select a card based on weighted probability (inverse of confidence)
 * Lower confidence = higher chance of being selected
 */
export function selectWeightedCard(cards: InfiniteCard[]): InfiniteCard {
  if (cards.length === 0) {
    throw new Error("Cannot select from empty card array");
  }

  // Calculate weights (inverse of confidence, so lower confidence = higher weight)
  // Weight formula: (4 - confidenceScore) to ensure lower scores have higher weights
  const weights = cards.map((card) => 4 - card.confidenceScore);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Random selection based on weights
  let random = Math.random() * totalWeight;
  for (let i = 0; i < cards.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return cards[i];
    }
  }

  // Fallback (should never reach here)
  return cards[cards.length - 1];
}

/**
 * Determine if a review card should be shown (20% chance)
 */
export function shouldShowReviewCard(): boolean {
  return Math.random() < 0.4;
}

/**
 * Select a review card based on weighted probability (inverse of consecutiveCorrect)
 * Lower streak = higher chance of being selected
 * Only considers cards with consecutiveCorrect < 2 (not yet mastered)
 */
export function selectWeightedReviewCard(cards: GroupedCard[]): GroupedCard {
  // Filter out mastered cards (consecutiveCorrect >= 2)
  const unmasteredCards = cards.filter((card) => card.consecutiveCorrect < 2);

  if (unmasteredCards.length === 0) {
    throw new Error("Cannot select from empty unmastered card array");
  }

  // Calculate weights: (2 - consecutiveCorrect)
  // consecutiveCorrect = 0 -> weight = 2 (most likely)
  // consecutiveCorrect = 1 -> weight = 1 (less likely)
  const weights = unmasteredCards.map((card) => 2 - card.consecutiveCorrect);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Random selection based on weights
  let random = Math.random() * totalWeight;
  for (let i = 0; i < unmasteredCards.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return unmasteredCards[i];
    }
  }

  // Fallback (should never reach here)
  return unmasteredCards[unmasteredCards.length - 1];
}
