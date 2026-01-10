"use client";

import { useState } from "react";
import { Set, addCard, editCard, deleteCard, clearSession } from "@/lib/storage";
import FlashcardEntry, {UpdateButton} from "./FlashcardEntry";

interface CardManagerProps {
  set: Set;
  setSet: (updated: Set) => void;
}

export default function CardManager({ set, setSet }: CardManagerProps) {
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focusCard, setFocusCard] = useState<{ cardId: string; field: "term" | "definition" } | null>(null);

  const handleAddCard = (field: "term" | "definition", value: string) => {
    console.log(`adding field '${field}' value '${value}'`);

    let newCard;
    if (field === "term") {
      newCard = addCard(set.id, value, "");
    } else if (field === "definition") {
      newCard = addCard(set.id, "", value);
    }
    if (!newCard) return;

    // Invalidate any existing session since cards changed
    clearSession(set.id);

    setSet({
      ...set,
      cards: [...set.cards, newCard],
    });

    // Set focus to the newly created card's field
    setFocusCard({ cardId: newCard.id, field });

    setNewTerm("");
    setNewDefinition("");
    setError(null);
  };

  const handleUpdateCard = (
    cardId: string,
    field: "term" | "definition",
    value: string
  ) => {
    const updatedCard = {
      ...set.cards.find((c) => c.id === cardId)!,
      [field]: value,
    };
    editCard(set.id, updatedCard);

    // Invalidate any existing session since cards changed
    clearSession(set.id);

    setSet({
      ...set,
      cards: set.cards.map((c) => (c.id === cardId ? updatedCard : c)),
    });
  };

  const handleToggleMarkdown = (cardId: string, isMarkdown: boolean) => {
    const updatedCard = {
      ...set.cards.find((c) => c.id === cardId)!,
      isMarkdown,
    };
    editCard(set.id, updatedCard);

    // Invalidate any existing session since cards changed
    clearSession(set.id);

    setSet({
      ...set,
      cards: set.cards.map((c) => (c.id === cardId ? updatedCard : c)),
    });
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCard(set.id, cardId);

    // Invalidate any existing session since cards changed
    clearSession(set.id);

    setSet({
      ...set,
      cards: set.cards.filter((c) => c.id !== cardId),
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-black">Edit Cards</h2>
      
      {/* Existing Cards */}
      {set.cards.map((card) => {
        const deleteButton: UpdateButton = {
          onClick: () => handleDeleteCard(card.id),
          icon: "delete",
          className: "flex items-center justify-center p-4 bg-white hover:bg-red-500 text-red-500 hover:text-white rounded-full shadow-sm",
        }

        return (
          <FlashcardEntry
            key={card.id}
            term={card.term}
            definition={card.definition}
            isMarkdown={card.isMarkdown}
            onChange={(field: "term" | "definition", value: string) => {
              handleUpdateCard(card.id, field, value);
              // Clear focus tracking once user starts editing
              if (focusCard?.cardId === card.id) {
                setFocusCard(null);
              }
            }}
            onMarkdownToggle={(isMarkdown) => handleToggleMarkdown(card.id, isMarkdown)}
            updateButton={deleteButton}
            readonly={false}
            autoFocusField={focusCard?.cardId === card.id ? focusCard.field : undefined}
          />
        );
      })}
      <FlashcardEntry
        key={"new-card"}
        term={""}
        definition={""}
        isMarkdown={false}
        onChange={(field: "term" | "definition", value: string) => handleAddCard(field, value)}
        readonly={false}
      />
    </div>
  );
}

// {error && (
//   <div className="w-full text-right">
//     <p className="text-red-600 text-xs font-medium mb-1">{error}</p>
//   </div>
// )}

    // <div className="space-y-4 text-black">
    //   <h2 className="text-xl font-semibold text-black">Edit Cards</h2>

    //   {/* Existing cards */}
    //   {set.cards.map((card) => (
    //     <FlashcardEntry
    //       key={card.id}
    //       term={card.term}
    //       definition={card.definition}
    //       onChange={(field, value) => handleUpdateCard(card.id, field, value)}
    //       onDelete={() => handleDeleteCard(card.id)}
    //     />
    //   ))}

    //   {/* New card input row */}
    //   <div className="space-y-2">
    //     <div className="flex gap-2 items-center">
    //       <input
    //         type="text"
    //         placeholder="Term"
    //         value={newTerm}
    //         onChange={(e) => setNewTerm(e.target.value)}
    //         className={`flex-1 rounded border px-2 py-1 shadow-sm text-black placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
    //           error && !newTerm ? "border-red-500" : "border-gray-300"
    //         }`}
    //       />

    //       <input
    //         type="text"
    //         placeholder="Definition"
    //         value={newDefinition}
    //         onChange={(e) => setNewDefinition(e.target.value)}
    //         className={`flex-1 rounded border px-2 py-1 shadow-sm text-black placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
    //           error && !newDefinition ? "border-red-500" : "border-gray-300"
    //         }`}
    //       />

    //       <button
    //         onClick={handleAddCard}
    //         className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm min-w-[60px]"
    //       >
    //         Add
    //       </button>
    //     </div>

    //   </div>
    // </div>
