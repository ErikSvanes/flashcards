"use client";

import { useState } from "react";
import { Set } from "@/lib/storage";
import { addCard, editCard, deleteCard, clearSession } from "@/lib/hybridStorage";
import { uploadCardImage, deleteCardImage } from "@/lib/imageUpload";
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
  const [uploadingImages, setUploadingImages] = useState<Record<string, "term" | "definition" | undefined>>({});

  const handleAddCard = async (field: "term" | "definition", value: string) => {
    console.log(`adding field '${field}' value '${value}'`);

    let newCard;
    if (field === "term") {
      newCard = await addCard(set.id, value, "");
    } else if (field === "definition") {
      newCard = await addCard(set.id, "", value);
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

  const handleUpdateCard = async (
    cardId: string,
    field: "term" | "definition",
    value: string
  ) => {
    const updatedCard = {
      ...set.cards.find((c) => c.id === cardId)!,
      [field]: value,
    };

    // Update UI immediately (optimistic update)
    setSet({
      ...set,
      cards: set.cards.map((c) => (c.id === cardId ? updatedCard : c)),
    });

    // Invalidate any existing session since cards changed
    clearSession(set.id);

    // Sync in background
    editCard(set.id, updatedCard);
  };

  const handleToggleMarkdown = async (cardId: string, isMarkdown: boolean) => {
    const updatedCard = {
      ...set.cards.find((c) => c.id === cardId)!,
      isMarkdown,
    };

    // Update UI immediately (optimistic update)
    setSet({
      ...set,
      cards: set.cards.map((c) => (c.id === cardId ? updatedCard : c)),
    });

    // Invalidate any existing session since cards changed
    clearSession(set.id);

    // Sync in background
    editCard(set.id, updatedCard);
  };

  const handleDeleteCard = async (cardId: string) => {
    // Update UI immediately (optimistic update)
    setSet({
      ...set,
      cards: set.cards.filter((c) => c.id !== cardId),
    });

    // Invalidate any existing session since cards changed
    clearSession(set.id);

    // Sync in background
    deleteCard(set.id, cardId);
  };

  const handleImageUpload = async (cardId: string, field: "term" | "definition", file: File) => {
    // Set uploading state
    setUploadingImages(prev => ({ ...prev, [cardId]: field }));

    try {
      // Upload image
      const result = await uploadCardImage(file, cardId, field);

      if (result.error) {
        console.error('Image upload failed:', result.error);
        alert(`Failed to upload image: ${result.error}`);
        return;
      }

      // Update card with image URL
      const card = set.cards.find(c => c.id === cardId);
      if (!card) return;

      const updatedCard = {
        ...card,
        [field === "term" ? "termImage" : "definitionImage"]: result.url,
      };

      // Update UI immediately
      setSet({
        ...set,
        cards: set.cards.map(c => c.id === cardId ? updatedCard : c),
      });

      // Invalidate session
      clearSession(set.id);

      // Sync in background
      editCard(set.id, updatedCard);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      // Clear uploading state
      setUploadingImages(prev => ({ ...prev, [cardId]: undefined }));
    }
  };

  const handleImageRemove = async (cardId: string, field: "term" | "definition") => {
    const card = set.cards.find(c => c.id === cardId);
    if (!card) return;

    const imageUrl = field === "term" ? card.termImage : card.definitionImage;
    if (!imageUrl) return;

    // Delete from storage
    const result = await deleteCardImage(imageUrl);
    if (!result.success) {
      console.error('Failed to delete image:', result.error);
      // Continue anyway to remove from card
    }

    // Update card to remove image URL
    const updatedCard = {
      ...card,
      [field === "term" ? "termImage" : "definitionImage"]: undefined,
    };

    // Update UI immediately
    setSet({
      ...set,
      cards: set.cards.map(c => c.id === cardId ? updatedCard : c),
    });

    // Invalidate session
    clearSession(set.id);

    // Sync in background
    editCard(set.id, updatedCard);
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
            termImage={card.termImage}
            definitionImage={card.definitionImage}
            isMarkdown={card.isMarkdown}
            onChange={(field: "term" | "definition", value: string) => {
              handleUpdateCard(card.id, field, value);
              // Clear focus tracking once user starts editing
              if (focusCard?.cardId === card.id) {
                setFocusCard(null);
              }
            }}
            onImageUpload={(field, file) => handleImageUpload(card.id, field, file)}
            onImageRemove={(field) => handleImageRemove(card.id, field)}
            onMarkdownToggle={(isMarkdown) => handleToggleMarkdown(card.id, isMarkdown)}
            updateButton={deleteButton}
            readonly={false}
            autoFocusField={focusCard?.cardId === card.id ? focusCard.field : undefined}
            uploadingField={uploadingImages[card.id]}
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
