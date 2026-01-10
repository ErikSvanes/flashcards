// src/components/study/FlashCard.tsx
"use client";

import { useState, useEffect } from "react";
import { CardOrientation } from "@/lib/studyTypes";
import MarkdownDisplay from "@/components/MarkdownDisplay";

interface FlashcardStudyCardProps {
  term: string;
  definition: string;
  isMarkdown?: boolean;
  flipped: boolean;
  onFlip: () => void;
  orientation: CardOrientation;
}

export default function FlashcardStudyCard({
  term,
  definition,
  isMarkdown = false,
  flipped,
  onFlip,
  orientation,
}: FlashcardStudyCardProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);

  // Track when flip animation is happening
  useEffect(() => {
    setIsFlipping(true);
    const timeout = setTimeout(() => setIsFlipping(false), 500); // Match animation duration
    return () => clearTimeout(timeout);
  }, [flipped]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!mouseDownPos) return;

    const deltaX = Math.abs(e.clientX - mouseDownPos.x);
    const deltaY = Math.abs(e.clientY - mouseDownPos.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only flip if mouse moved less than 5px (not a drag)
    if (distance < 5) {
      onFlip();
    }

    setMouseDownPos(null);
  };

  // Determine what to show based on orientation and flip state
  const showingTerm =
    (orientation === "term-first" && !flipped) ||
    (orientation === "definition-first" && flipped);

  const displayText = showingTerm ? term : definition;
  const label = showingTerm ? "Term" : "Definition";

  return (
    <div className="w-full h-[500px]" style={{ perspective: "1000px" }}>
      <div
        className={`bg-white p-8 rounded-lg shadow-lg w-full h-full flex flex-col items-center cursor-pointer hover:shadow-xl transition-all duration-500 ${
          isFlipping ? "select-none" : ""
        }`}
        style={{
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        <div
          className="w-full h-full flex flex-col items-center"
          style={{
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            backfaceVisibility: "hidden",
          }}
        >
          <p className="text-sm text-gray-500 mb-2">{label}</p>
          <div className="flex-1 overflow-y-auto w-full flex items-start justify-center py-4">
            {isMarkdown && !showingTerm ? (
              <MarkdownDisplay
                content={displayText}
                className="text-2xl font-medium"
              />
            ) : (
              <p className="text-left text-2xl text-black font-medium whitespace-pre-line">
                {displayText}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">Click to flip</p>
        </div>
      </div>
    </div>
  );
}
