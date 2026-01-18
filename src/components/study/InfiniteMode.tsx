// src/components/study/InfiniteMode.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InfiniteSession } from "@/lib/studyTypes";
import { saveSession, clearSession } from "@/lib/hybridStorage";
import { selectWeightedCard } from "@/lib/studyUtils";
import FlashcardStudyCard from "./FlashcardStudyCard";

interface InfiniteModeProps {
  setId: string;
  session: InfiniteSession;
  setSession: (session: InfiniteSession) => void;
}

export default function InfiniteMode({
  setId,
  session,
  setSession,
}: InfiniteModeProps) {
  const router = useRouter();

  // Auto-save session whenever it changes
  // For infinite mode, save to all selected sets
  useEffect(() => {
    const selectedSetIds = session.settings.selectedSetIds || [setId];
    selectedSetIds.forEach((id) => {
      saveSession(id, session);
    });
  }, [setId, session]);

  const { cards, currentIndex, totalCardsStudied, settings } = session;

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-gray-700 mb-6">No cards available to study.</p>
          <button
            onClick={() => {
              clearSession(setId);
              router.push(`/sets/${setId}`);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Set
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const flipCard = () => {
    const updatedCards = cards.map((c, i) =>
      i === currentIndex ? { ...c, flipped: !c.flipped } : c
    );
    setSession({ ...session, cards: updatedCards });
  };

  const handleRating = (rating: 1 | 2 | 3) => {
    // Update confidence score as running average
    const updatedCard = {
      ...currentCard,
      confidenceScore:
        (currentCard.confidenceScore * currentCard.timesRated + rating) /
        (currentCard.timesRated + 1),
      timesRated: currentCard.timesRated + 1,
      flipped: false, // Reset flip for next time
    };

    // Update cards array
    const updatedCards = cards.map((c) =>
      c.id === currentCard.id ? updatedCard : c
    );

    // Select next card using weighted probability, avoiding the same card
    let nextCard = selectWeightedCard(updatedCards);

    // If we have more than 1 card and we got the same card, try again
    if (updatedCards.length > 1 && nextCard.id === currentCard.id) {
      // Filter out current card and select from remaining
      const otherCards = updatedCards.filter((c) => c.id !== currentCard.id);
      nextCard = selectWeightedCard(otherCards);
    }

    const nextIndex = updatedCards.findIndex((c) => c.id === nextCard.id);

    setSession({
      ...session,
      cards: updatedCards,
      currentIndex: nextIndex,
      totalCardsStudied: totalCardsStudied + 1,
    });
  };

  const handleExit = () => {
    router.push(`/sets/${setId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <button
            onClick={handleExit}
            className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
          >
            ← Exit Study
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Infinite Mode
          </h1>
          <div className="text-sm text-gray-600">
            <p>Cards studied: {totalCardsStudied}</p>
          </div>
        </div>

        {/* Flash Card */}
        <FlashcardStudyCard
          term={currentCard.term}
          definition={currentCard.definition}
          termImage={currentCard.termImage}
          definitionImage={currentCard.definitionImage}
          isMarkdown={currentCard.isMarkdown}
          flipped={currentCard.flipped}
          onFlip={flipCard}
          orientation={settings.orientation}
        />

        {/* Rating Buttons */}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => handleRating(1)}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            <div className="text-lg">1</div>
            <div className="text-xs">Don't Know</div>
          </button>
          <button
            onClick={() => handleRating(2)}
            className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium"
          >
            <div className="text-lg">2</div>
            <div className="text-xs">Somewhat</div>
          </button>
          <button
            onClick={() => handleRating(3)}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <div className="text-lg">3</div>
            <div className="text-xs">Got It</div>
          </button>
        </div>
      </div>
    </div>
  );
}
