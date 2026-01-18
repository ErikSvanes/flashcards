// src/components/MoveToModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Folder } from "@/lib/storage";
import { getFolders, moveItem, isDescendant } from "@/lib/hybridStorage";

interface MoveToModalProps {
  itemId: string;
  itemType: "folder" | "set";
  currentParentId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MoveToModal({
  itemId,
  itemType,
  currentParentId,
  onClose,
  onSuccess,
}: MoveToModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    currentParentId
  );

  useEffect(() => {
    getFolders().then(setFolders);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleMove = async () => {
    // Prevent moving to the same location
    if (selectedParentId === currentParentId) {
      alert("Item is already in this location");
      return;
    }

    // Prevent circular references for folders
    if (
      itemType === "folder" &&
      selectedParentId &&
      (itemId === selectedParentId || (await isDescendant(selectedParentId, itemId)))
    ) {
      alert("Cannot move a folder into itself or its descendants");
      return;
    }

    try {
      await moveItem(itemId, selectedParentId, itemType);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to move item");
    }
  };

  // Build folder tree structure for display
  const buildFolderTree = () => {
    const tree: { folder: Folder | null; level: number }[] = [
      { folder: null, level: 0 },
    ];

    const addChildren = (parentId: string | null, level: number) => {
      const children = folders
        .filter((f) => f.parentId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name));

      children.forEach((child) => {
        // Don't show the item being moved in the tree (can't move into itself)
        if (child.id !== itemId) {
          tree.push({ folder: child, level });
          addChildren(child.id, level + 1);
        }
      });
    };

    addChildren(null, 1);
    return tree;
  };

  const folderTree = buildFolderTree();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4">
          Move {itemType === "folder" ? "Folder" : "Set"}
        </h2>

        <div className="flex-1 overflow-y-auto border rounded p-2 mb-4">
          {folderTree.map((item, index) => {
            const folderId = item.folder?.id || null;
            const isCurrentLocation = folderId === currentParentId;
            const isSelf = folderId === itemId;

            return (
              <button
                key={index}
                onClick={() => setSelectedParentId(folderId)}
                disabled={isSelf}
                className={`w-full text-left px-3 py-2 rounded transition ${
                  selectedParentId === folderId
                    ? "bg-blue-100 border-2 border-blue-400"
                    : "hover:bg-gray-100"
                } ${isSelf ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ paddingLeft: `${item.level * 1.5 + 0.75}rem` }}
              >
                <div className="flex items-center gap-2">
                  {item.folder ? (
                    <>
                      <span>📁</span>
                      <span>{item.folder.name}</span>
                    </>
                  ) : (
                    <>
                      <span>🏠</span>
                      <span className="font-semibold">Root</span>
                    </>
                  )}
                  {isCurrentLocation && (
                    <span className="text-xs text-gray-500 ml-auto">
                      (current)
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
}
