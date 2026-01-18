// src/components/StudySetupModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Set } from "@/lib/storage";
import {
  StudyMode,
  CardOrientation,
  StudySettings,
  StandardSession,
  InfiniteSession,
  GroupedSession,
  StandardCard,
  InfiniteCard,
  GroupedCard,
} from "@/lib/studyTypes";
import { getSession, saveSession, clearSession } from "@/lib/hybridStorage";
import { shuffleCards, chunkCards } from "@/lib/studyUtils";

interface StudySetupModalProps {
  open: boolean;
  onClose: () => void;
  currentSet: Set;
  allSets: Set[];
}

export default function StudySetupModal({
  open,
  onClose,
  currentSet,
  allSets,
}: StudySetupModalProps) {
  const router = useRouter();
  const [existingSession, setExistingSession] = useState<any>(null);

  const [mode, setMode] = useState<StudyMode>("standard");
  const [shuffle, setShuffle] = useState(true);
  const [orientation, setOrientation] = useState<CardOrientation>("term-first");
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([currentSet.id]);

  useEffect(() => {
    if (open) {
      const session = getSession(currentSet.id);
      setExistingSession(session);
    }
  }, [open, currentSet.id]);

  if (!open) return null;

  const handleResume = () => {
    onClose();
    router.push(`/study/${currentSet.id}`);
  };

  const handleDeleteSession = () => {
    // clearSession now handles infinite mode internally
    clearSession(currentSet.id);
    setExistingSession(null);
  };

  const handleStart = () => {
    // Gather all cards based on mode
    let allCards =
      mode === "infinite"
        ? allSets
            .filter((s) => selectedSetIds.includes(s.id))
            .flatMap((s) => s.cards)
        : [...currentSet.cards];

    if (allCards.length === 0) {
      alert("No cards available to study!");
      return;
    }

    // Shuffle if requested
    if (shuffle) {
      allCards = shuffleCards(allCards);
    }

    const settings: StudySettings = {
      mode,
      shuffle,
      orientation,
      selectedSetIds: mode === "infinite" ? selectedSetIds : undefined,
    };

    const timestamp = Date.now();

    // Create session based on mode
    let session:
      | StandardSession
      | InfiniteSession
      | GroupedSession;

    if (mode === "standard") {
      const cards: StandardCard[] = allCards.map((c) => ({
        ...c,
        flipped: false,
        inDontKnowPile: false,
      }));

      session = {
        mode: "standard",
        settings,
        cards,
        currentIndex: 0,
        dontKnowPile: [],
        timestamp,
      };
    } else if (mode === "infinite") {
      const cards: InfiniteCard[] = allCards.map((c) => ({
        ...c,
        flipped: false,
        confidenceScore: 1.5, // Start at middle
        timesRated: 0,
      }));

      session = {
        mode: "infinite",
        settings,
        cards,
        currentIndex: 0,
        totalCardsStudied: 0,
        timestamp,
      };
    } else {
      // grouped mode
      const groups = chunkCards(allCards, 5);
      const allGroupsWithMetadata: GroupedCard[][] = groups.map(
        (group, groupIndex) =>
          group.map((c) => ({
            ...c,
            flipped: false,
            groupIndex,
            consecutiveCorrect: 0,
          }))
      );

      session = {
        mode: "grouped",
        settings,
        allGroups: allGroupsWithMetadata,
        currentGroupIndex: 0,
        currentCards: allGroupsWithMetadata[0] || [],
        currentIndex: 0,
        dontKnowPile: [],
        reviewPool: [],
        timestamp,
      };
    }

    // Save and navigate
    if (mode === "infinite") {
      // For infinite mode, save session under ALL selected sets
      selectedSetIds.forEach((id) => {
        saveSession(id, session);
      });
    } else {
      // For standard/grouped, only save under current set
      saveSession(currentSet.id, session);
    }
    onClose();
    router.push(`/study/${currentSet.id}`);
  };

  const toggleSetSelection = (setId: string) => {
    if (selectedSetIds.includes(setId)) {
      setSelectedSetIds(selectedSetIds.filter((id) => id !== setId));
    } else {
      setSelectedSetIds([...selectedSetIds, setId]);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Study Setup
        </h2>

        {/* Resume existing session */}
        {existingSession && (
          <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-gray-700 mb-1 font-medium">
              Existing {existingSession.mode} session found
            </p>
            <p className="text-xs text-gray-600 mb-3">
              {existingSession.mode === "infinite" && existingSession.settings?.selectedSetIds
                ? `Using ${existingSession.settings.selectedSetIds.length} set(s)`
                : "Continue where you left off or start fresh"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleResume}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Resume Session
              </button>
              <button
                onClick={handleDeleteSession}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete Session
              </button>
            </div>
          </div>
        )}

        {/* Mode selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Study Mode
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="standard"
                checked={mode === "standard"}
                onChange={(e) => setMode(e.target.value as StudyMode)}
                className="mr-2"
              />
              <span className="text-gray-800">Standard - Learn until mastered</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="infinite"
                checked={mode === "infinite"}
                onChange={(e) => setMode(e.target.value as StudyMode)}
                className="mr-2"
              />
              <span className="text-gray-800">Infinite - Continuous practice with ratings</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="grouped"
                checked={mode === "grouped"}
                onChange={(e) => setMode(e.target.value as StudyMode)}
                className="mr-2"
              />
              <span className="text-gray-800">Grouped - Learn in groups of 5</span>
            </label>
          </div>
        </div>

        {/* Set selection for infinite mode */}
        {mode === "infinite" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Sets
            </label>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {allSets.map((set) => (
                <label key={set.id} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    checked={selectedSetIds.includes(set.id)}
                    onChange={() => toggleSetSelection(set.id)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-800">{set.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Shuffle */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-800">Shuffle cards</span>
          </label>
        </div>

        {/* Orientation */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Orientation
          </label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as CardOrientation)}
            className="w-full border rounded px-3 py-2 text-gray-800"
          >
            <option value="term-first">Term → Definition</option>
            <option value="definition-first">Definition → Term</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={mode === "infinite" && selectedSetIds.length === 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
