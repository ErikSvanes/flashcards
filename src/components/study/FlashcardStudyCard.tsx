// src/components/study/FlashCard.tsx
"use client";

import { useState, useEffect } from "react";
import { CardOrientation } from "@/lib/studyTypes";
import MarkdownDisplay from "@/components/MarkdownDisplay";
import ImageModal from "@/components/ImageModal";

interface FlashcardStudyCardProps {
  term: string;
  definition: string;
  termImage?: string;
  definitionImage?: string;
  isMarkdown?: boolean;
  flipped: boolean;
  onFlip: () => void;
  orientation: CardOrientation;
}

export default function FlashcardStudyCard({
  term,
  definition,
  termImage,
  definitionImage,
  isMarkdown = false,
  flipped,
  onFlip,
  orientation,
}: FlashcardStudyCardProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);

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
  const displayImage = showingTerm ? termImage : definitionImage;
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
          <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-start py-4 gap-4">
            {displayImage && (
              <img
                src={displayImage}
                alt={label}
                className="max-w-full max-h-64 object-contain rounded shadow-md cursor-pointer hover:opacity-80 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalImage({ url: displayImage, alt: label });
                }}
              />
            )}
            <div className="flex items-start justify-center w-full">
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
          </div>
          <p className="text-xs text-gray-400 mt-4">Click to flip</p>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        open={!!modalImage}
        onClose={() => setModalImage(null)}
        imageUrl={modalImage?.url || ""}
        alt={modalImage?.alt}
      />
    </div>
  );
}
