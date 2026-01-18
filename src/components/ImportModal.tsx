"use client";

import { useState, useEffect } from "react";
import { Card, Set } from "@/lib/storage";
import { addCard, clearSession } from "@/lib/hybridStorage";
import EditableCardRow from "./FlashcardEntry";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  targetSet: Set;
  onImportComplete: (newSet: Set) => void;
}

export default function ImportModal({
  open,
  onClose,
  targetSet,
  onImportComplete,
}: ImportModalProps) {
  const [delimiter, setDelimiter] = useState("\t");
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [input, setInput] = useState("");
  const [parsedCards, setParsedCards] = useState<Card[]>([]);

  // Reset modal state when closed
  useEffect(() => {
    if (!open) {
      setInput("");
      setParsedCards([]);
      setCustomDelimiter("");
      setDelimiter("\t");
    }
  }, [open]);

  // Parse input whenever it changes
  useEffect(() => {
    const actualDelim = delimiter === "custom" ? customDelimiter : delimiter;
    if (!actualDelim) return;

    const lines = input.trim().split(/\r?\n/);
    const newCards = lines
      .map((line) => {
        const [term, definition] = line.split(actualDelim);
        if (!term || !definition) return null;
        return {
          id: crypto.randomUUID(),
          term: term.trim(),
          definition: definition.trim(),
        } as Card;
      })
      .filter(Boolean) as Card[];

    setParsedCards(newCards);
  }, [input, delimiter, customDelimiter]);

  const handleImport = async () => {
    // Add each card individually using the hybrid storage
    const addedCards: Card[] = [];
    for (const card of parsedCards) {
      const newCard = await addCard(targetSet.id, card.term, card.definition);
      if (newCard) {
        addedCards.push(newCard);
      }
    }

    const newSet: Set = {
      ...targetSet,
      cards: [...targetSet.cards, ...addedCards],
    };

    // Invalidate any existing session since cards changed
    clearSession(targetSet.id);

    onImportComplete(newSet);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 rounded-lg shadow-xl w-full max-w-5xl h-[80vh] p-6 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Cards</h2>

        {/* Delimiter selection */}
        <div className="flex items-center gap-2 mb-4">
          <label className="text-gray-700">Delimiter:</label>
          <select
            className="border rounded px-2 py-1"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          >
            <option value="\t">Tab (\t)</option>
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="|">Pipe (|)</option>
            <option value="custom">Custom</option>
          </select>
          {delimiter === "custom" && (
            <input
              type="text"
              maxLength={1}
              value={customDelimiter}
              onChange={(e) => setCustomDelimiter(e.target.value)}
              className="border rounded px-2 py-1 w-12 text-center"
            />
          )}
        </div>

        {/* Textarea + Preview */}
        <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
          {/* Textarea */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your terms and definitions here..."
            className="border p-2 rounded resize-none w-full md:w-1/2 h-full overflow-y-scroll text-gray-900"
          />

          {/* Preview */}
          <div className="overflow-y-scroll h-full w-full md:w-1/2 bg-gray-50 p-2 rounded">
            {parsedCards.length === 0 ? (
              <p className="text-gray-500 italic">Preview will appear here</p>
            ) : (
              parsedCards.map((card) => (
                <EditableCardRow
                  key={card.id}
                  term={card.term}
                  definition={card.definition}
                  isMarkdown={false}
                  readonly={true}
                />
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedCards.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50"
          >
            Import {parsedCards.length > 0 ? `(${parsedCards.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
