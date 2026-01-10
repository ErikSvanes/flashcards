// src/components/study/StandardMode.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StandardSession, StandardCard } from "@/lib/studyTypes";
import { saveSession, clearSession } from "@/lib/storage";
import FlashcardStudyCard from "./FlashcardStudyCard";

interface StandardModeProps {
  setId: string;
  session: StandardSession;
  setSession: (session: StandardSession) => void;
}

export default function StandardMode({
  setId,
  session,
  setSession,
}: StandardModeProps) {
  const router = useRouter();

  // Auto-save session whenever it changes
  useEffect(() => {
    saveSession(setId, session);
  }, [setId, session]);

  // Handle transition to don't know pile
  useEffect(() => {
    const { cards, currentIndex, dontKnowPile } = session;
    if (
      (cards.length === 0 || currentIndex >= cards.length) &&
      dontKnowPile.length > 0
    ) {
      // Start reviewing don't know pile
      setSession({
        ...session,
        cards: dontKnowPile.map((c) => ({ ...c, flipped: false })),
        currentIndex: 0,
        dontKnowPile: [],
      });
    }
  }, [session.currentIndex, session.cards.length, session.dontKnowPile.length]);

  const { cards, currentIndex, dontKnowPile, settings } = session;

  // Check if we're completely done
  if (
    (cards.length === 0 || currentIndex >= cards.length) &&
    dontKnowPile.length === 0
  ) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-3xl font-bold mb-4 text-green-600">
            Congratulations!
          </h1>
          <p className="text-gray-700 mb-6">
            You've completed all cards in this set!
          </p>
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

  // Waiting for transition
  if (currentIndex >= cards.length) {
    return null;
  }

  const currentCard = cards[currentIndex];

  const flipCard = () => {
    const updatedCards = cards.map((c, i) =>
      i === currentIndex ? { ...c, flipped: !c.flipped } : c
    );
    setSession({ ...session, cards: updatedCards });
  };

  const handleAnswer = (gotIt: boolean) => {
    const nextIndex = currentIndex + 1;

    if (!gotIt) {
      // Add to don't know pile
      setSession({
        ...session,
        currentIndex: nextIndex,
        dontKnowPile: [...dontKnowPile, currentCard],
      });
    } else {
      // Just move to next card (card is removed from rotation)
      setSession({
        ...session,
        currentIndex: nextIndex,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <button
            onClick={() => router.push(`/sets/${setId}`)}
            className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
          >
            ← Exit Study
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Standard Mode
          </h1>
          <p className="text-gray-600">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>

        {/* Flash Card */}
        <FlashcardStudyCard
          term={currentCard.term}
          definition={currentCard.definition}
          isMarkdown={currentCard.isMarkdown}
          flipped={currentCard.flipped}
          onFlip={flipCard}
          orientation={settings.orientation}
        />

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={() => handleAnswer(false)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Don't Know
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
