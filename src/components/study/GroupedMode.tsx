// src/components/study/GroupedMode.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GroupedSession, GroupedCard } from "@/lib/studyTypes";
import { saveSession, clearSession } from "@/lib/storage";
import { shouldShowReviewCard, selectWeightedReviewCard } from "@/lib/studyUtils";
import FlashcardStudyCard from "./FlashcardStudyCard";

interface GroupedModeProps {
  setId: string;
  session: GroupedSession;
  setSession: (session: GroupedSession) => void;
}

export default function GroupedMode({
  setId,
  session,
  setSession,
}: GroupedModeProps) {
  const router = useRouter();

  // Track the current card being shown (to prevent random changes on re-render)
  const [displayedCard, setDisplayedCard] = useState<{
    card: GroupedCard;
    isReview: boolean;
  } | null>(null);

  // Counter that increments whenever we need to select a new card
  const [cardSelectionTrigger, setCardSelectionTrigger] = useState(0);

  // Auto-save session whenever it changes, including the displayed card
  useEffect(() => {
    if (displayedCard) {
      saveSession(setId, {
        ...session,
        lastDisplayedCardId: displayedCard.card.id,
      });
    } else {
      saveSession(setId, session);
    }
  }, [setId, session, displayedCard]);

  // Handle group transitions
  useEffect(() => {
    const {
      currentCards,
      currentIndex,
      dontKnowPile,
      allGroups,
      currentGroupIndex,
      reviewPool,
    } = session;

    // Only trigger transitions when we've reached the end of current cards
    if (currentIndex >= currentCards.length && currentCards.length > 0) {
      if (dontKnowPile.length > 0) {
        // Restart current group with don't know pile
        setSession({
          ...session,
          currentCards: dontKnowPile.map((c) => ({ ...c, flipped: false })),
          currentIndex: 0,
          dontKnowPile: [],
        });
      } else {
        // Move current group cards to review pool (keep their consecutiveCorrect values)
        const completedGroupCards = currentCards.map((c) => ({
          ...c,
          flipped: false,
        }));

        const nextGroupIndex = currentGroupIndex + 1;

        if (nextGroupIndex >= allGroups.length) {
          // No more groups, just keep reviewing
          setSession({
            ...session,
            currentGroupIndex: nextGroupIndex,
            currentCards: [],
            currentIndex: 0,
            reviewPool: [...reviewPool, ...completedGroupCards],
          });
        } else {
          // Load next group
          const nextGroup = allGroups[nextGroupIndex].map((c) => ({
            ...c,
            flipped: false,
          }));

          setSession({
            ...session,
            currentGroupIndex: nextGroupIndex,
            currentCards: nextGroup,
            currentIndex: 0,
            reviewPool: [...reviewPool, ...completedGroupCards],
          });
        }
      }
    }
  }, [
    session.currentIndex,
    session.currentCards.length,
    session.dontKnowPile.length,
  ]);

  const {
    allGroups,
    currentGroupIndex,
    currentCards,
    currentIndex,
    dontKnowPile,
    reviewPool,
    settings,
  } = session;

  // Determine which card to show - use effect to decide ONCE per card
  // MUST be before any conditional returns (React hook rules)
  useEffect(() => {
    // First, check if we're restoring a saved review card
    if (session.lastDisplayedCardId && !displayedCard) {
      const savedCard = reviewPool.find(
        (c) => c.id === session.lastDisplayedCardId
      );
      if (savedCard && savedCard.consecutiveCorrect < 2) {
        setDisplayedCard({ card: savedCard, isReview: true });
        return;
      }
    }

    // Filter review pool to only unmastered cards (consecutiveCorrect < 2)
    const unmasteredReviewCards = reviewPool.filter(
      (c) => c.consecutiveCorrect < 2
    );

    // If we've finished all groups, only show review cards
    if (
      currentGroupIndex >= allGroups.length &&
      unmasteredReviewCards.length > 0
    ) {
      let selectedCard = selectWeightedReviewCard(unmasteredReviewCards);

      // Avoid showing the same card twice in a row (if we have more than 1 card)
      if (
        unmasteredReviewCards.length > 1 &&
        displayedCard?.isReview &&
        displayedCard.card.id === selectedCard.id
      ) {
        const otherCards = unmasteredReviewCards.filter(
          (c) => c.id !== displayedCard.card.id
        );
        selectedCard = selectWeightedReviewCard(otherCards);
      }

      setDisplayedCard({
        card: selectedCard,
        isReview: true,
      });
    } else if (currentCards.length > 0 && currentIndex < currentCards.length) {
      // Normal case: showing current group card or maybe a review card
      const groupCard = currentCards[currentIndex];

      if (
        unmasteredReviewCards.length > 0 &&
        shouldShowReviewCard()
      ) {
        // Use weighted selection for review card
        let selectedCard = selectWeightedReviewCard(unmasteredReviewCards);

        // Avoid showing the same review card twice in a row (if we have more than 1)
        if (
          unmasteredReviewCards.length > 1 &&
          displayedCard?.isReview &&
          displayedCard.card.id === selectedCard.id
        ) {
          const otherCards = unmasteredReviewCards.filter(
            (c) => c.id !== displayedCard.card.id
          );
          selectedCard = selectWeightedReviewCard(otherCards);
        }

        setDisplayedCard({
          card: selectedCard,
          isReview: true,
        });
      } else {
        // Show the current group card
        setDisplayedCard({
          card: groupCard,
          isReview: false,
        });
      }
    } else {
      setDisplayedCard(null);
    }
  }, [cardSelectionTrigger, currentIndex, currentGroupIndex]);

  // Check if we're completely done (all groups + all unmastered review cards)
  const unmasteredCount = reviewPool.filter((c) => c.consecutiveCorrect < 2).length;
  if (currentGroupIndex >= allGroups.length && unmasteredCount === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-3xl font-bold mb-4 text-green-600">
            Congratulations!
          </h1>
          <p className="text-gray-700 mb-6">
            You've completed all groups and mastered all cards!
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

  // Waiting for transition (but we have review cards)
  if (currentIndex >= currentCards.length && currentCards.length > 0) {
    return null;
  }

  if (!displayedCard) {
    return null;
  }

  const currentCard = displayedCard.card;
  const isReviewCardShown = displayedCard.isReview;

  const flipCard = () => {
    const flippedCard = { ...currentCard, flipped: !currentCard.flipped };
    setDisplayedCard({ ...displayedCard, card: flippedCard });

    if (isReviewCardShown) {
      // Update review pool
      const updatedReviewPool = reviewPool.map((c) =>
        c.id === currentCard.id ? flippedCard : c
      );
      setSession({ ...session, reviewPool: updatedReviewPool });
    } else {
      // Update current cards
      const updatedCards = currentCards.map((c, i) =>
        i === currentIndex ? flippedCard : c
      );
      setSession({ ...session, currentCards: updatedCards });
    }
  };

  const handleAnswer = (gotIt: boolean) => {
    if (isReviewCardShown) {
      // Handle review card - update consecutiveCorrect
      const updatedReviewCard = {
        ...currentCard,
        consecutiveCorrect: gotIt
          ? Math.min(currentCard.consecutiveCorrect + 1, 2)
          : 0,
        flipped: false,
      };

      // Update review pool (mastered cards stay in pool but won't be selected)
      const updatedReviewPool = reviewPool.map((c) =>
        c.id === currentCard.id ? updatedReviewCard : c
      );

      setSession({
        ...session,
        reviewPool: updatedReviewPool,
      });

      // Trigger selection of next card
      setCardSelectionTrigger((prev) => prev + 1);
      // Don't advance currentIndex since we showed an interstitial review card
    } else {
      // Handle regular group card - update consecutiveCorrect
      const nextIndex = currentIndex + 1;
      const updatedCard = {
        ...currentCard,
        consecutiveCorrect: gotIt
          ? Math.min(currentCard.consecutiveCorrect + 1, 2)
          : 0,
      };

      // Update the card in currentCards
      const updatedCurrentCards = currentCards.map((c) =>
        c.id === currentCard.id ? updatedCard : c
      );

      if (!gotIt) {
        setSession({
          ...session,
          currentCards: updatedCurrentCards,
          currentIndex: nextIndex,
          dontKnowPile: [...dontKnowPile, updatedCard],
        });
      } else {
        setSession({
          ...session,
          currentCards: updatedCurrentCards,
          currentIndex: nextIndex,
        });
      }

      // Trigger selection of next card
      setCardSelectionTrigger((prev) => prev + 1);
    }
  };

  const totalGroups = allGroups.length;

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
            Grouped Mode
          </h1>
          <p className="text-gray-600">
            Group {Math.min(currentGroupIndex + 1, totalGroups)} of{" "}
            {totalGroups}
          </p>
          {currentCards.length > 0 && !isReviewCardShown && (
            <p className="text-gray-600 text-sm">
              Card {currentIndex + 1} of {currentCards.length}
            </p>
          )}
          {isReviewCardShown && (
            <p className="text-purple-600 text-sm font-medium mt-1">
              📚 Review Card (Streak: {currentCard.consecutiveCorrect}/2)
            </p>
          )}
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
