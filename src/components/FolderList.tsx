// src/components/FolderList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FolderItem } from "@/lib/storage";
import {
  moveItem,
  isDescendant,
  deleteFolder,
  deleteSet,
  updateFolder,
  updateSet,
  getItemsInFolder,
  clearSession,
} from "@/lib/hybridStorage";
import ContextMenu, { MenuOption } from "./ContextMenu";
import MoveToModal from "./MoveToModal";

interface FolderListProps {
  items: FolderItem[];
  currentFolderId: string | null;
  onUpdate?: () => void;
}

function DraggableItem({
  item,
  children,
}: {
  item: FolderItem;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.data.id,
      data: { item },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function DroppableFolder({
  folderId,
  children,
  isOver,
}: {
  folderId: string;
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: `folder-${folderId}`,
    data: { folderId },
  });

  return (
    <div ref={setNodeRef} className={isOver ? "ring-2 ring-blue-400" : ""}>
      {children}
    </div>
  );
}

export default function FolderList({
  items,
  currentFolderId,
  onUpdate,
}: FolderListProps) {
  const [activeItem, setActiveItem] = useState<FolderItem | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: FolderItem;
  } | null>(null);
  const [moveToModal, setMoveToModal] = useState<{
    itemId: string;
    itemType: "folder" | "set";
    currentParentId: string | null;
  } | null>(null);
  const router = useRouter();

  // Configure sensors with distance threshold so clicks still work
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2, // Need to drag 2px before drag starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as FolderItem;
    setActiveItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    setOverId(null);

    const { active, over } = event;
    if (!over || !active.data.current) return;

    const draggedItem = active.data.current.item as FolderItem;
    const draggedId = draggedItem.data.id;
    const draggedType = draggedItem.type;

    let targetParentId: string | null = currentFolderId;

    // Check if dropped on a folder
    if (over.id.toString().startsWith("folder-")) {
      targetParentId = over.id.toString().replace("folder-", "");
    } else if (over.id === "root-dropzone") {
      targetParentId = null;
    }

    // Don't move if dropping on the current parent
    if (targetParentId === draggedItem.data.parentId) return;

    // Prevent circular references for folders
    if (
      draggedType === "folder" &&
      targetParentId &&
      (draggedId === targetParentId || (await isDescendant(targetParentId, draggedId)))
    ) {
      alert("Cannot move a folder into itself or its descendants");
      return;
    }

    try {
      await moveItem(draggedId, targetParentId, draggedType);
      if (onUpdate) onUpdate();
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to move item");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: FolderItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleRename = async (item: FolderItem) => {
    const newName = prompt(
      `Rename ${item.type === "folder" ? "folder" : "set"}:`,
      item.data.name
    );
    if (newName && newName.trim() && newName.trim() !== item.data.name) {
      if (item.type === "folder") {
        await updateFolder(item.data.id, { name: newName.trim() });
      } else {
        await updateSet(item.data.id, { name: newName.trim() });
      }
      if (onUpdate) onUpdate();
      router.refresh();
    }
  };

  const handleDelete = async (item: FolderItem) => {
    if (item.type === "folder") {
      // Count items in folder for confirmation message
      const itemsInFolder = await getItemsInFolder(item.data.id);
      const confirmMessage =
        itemsInFolder.length > 0
          ? `Delete folder "${item.data.name}" and all ${itemsInFolder.length} item(s) inside?`
          : `Delete folder "${item.data.name}"?`;

      if (confirm(confirmMessage)) {
        await deleteFolder(item.data.id, true); // cascade delete
        if (onUpdate) onUpdate();
        router.refresh();
      }
    } else {
      if (confirm(`Delete set "${item.data.name}"?`)) {
        await deleteSet(item.data.id);
        clearSession(item.data.id);
        if (onUpdate) onUpdate();
        router.refresh();
      }
    }
  };

  const getContextMenuOptions = (item: FolderItem): MenuOption[] => {
    return [
      {
        label: "Move to...",
        onClick: () => {
          setMoveToModal({
            itemId: item.data.id,
            itemType: item.type,
            currentParentId: item.data.parentId,
          });
        },
      },
      {
        label: "Rename",
        onClick: () => handleRename(item),
      },
      {
        label: "Delete",
        onClick: () => handleDelete(item),
        variant: "danger",
      },
    ];
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(event) => setOverId(event.over?.id.toString() || null)}
    >
      {/* Root dropzone */}
      {currentFolderId && (
        <RootDropzone isOver={overId === "root-dropzone"} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <DraggableItem key={item.data.id} item={item}>
            {/* Mobile three-dot menu button */}
            <button
              className="absolute top-2 right-2 z-10 p-2 text-gray-600 hover:text-gray-900 md:hidden"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setContextMenu({
                  x: rect.left,
                  y: rect.bottom,
                  item,
                });
              }}
              aria-label="More options"
            >
              ⋮
            </button>

            {item.type === "folder" ? (
                <DroppableFolder
                  folderId={item.data.id}
                  isOver={overId === `folder-${item.data.id}`}
                >
                  <Link
                    href={`/?folderId=${item.data.id}`}
                    className="block p-4 bg-white rounded shadow hover:shadow-md transition"
                    onContextMenu={(e) => handleContextMenu(e, item)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📁</span>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {item.data.name}
                      </h2>
                    </div>
                    {item.data.description && (
                      <p className="text-gray-600 mt-2">{item.data.description}</p>
                    )}
                  </Link>
                </DroppableFolder>
              ) : (
                <Link
                  href={`/sets/${item.data.id}`}
                  className="block p-4 bg-white rounded shadow hover:shadow-md transition"
                  onContextMenu={(e) => handleContextMenu(e, item)}
                >
                  <h2 className="text-xl font-semibold text-gray-800">
                    {item.data.name}
                  </h2>
                  {item.data.description && (
                    <p className="text-gray-600 mt-2">{item.data.description}</p>
                  )}
                  <p className="text-gray-400 mt-2 text-sm">
                    {item.data.cards.length}{" "}
                    {item.data.cards.length === 1 ? "card" : "cards"}
                  </p>
                </Link>
              )}
          </DraggableItem>
        ))}
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="p-4 bg-white rounded shadow-lg opacity-90">
            <div className="flex items-center gap-2">
              {activeItem.type === "folder" && <span className="text-2xl">📁</span>}
              <h2 className="text-xl font-semibold text-gray-800">
                {activeItem.data.name}
              </h2>
            </div>
          </div>
        )}
      </DragOverlay>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={getContextMenuOptions(contextMenu.item)}
        />
      )}

      {/* Move To Modal */}
      {moveToModal && (
        <MoveToModal
          itemId={moveToModal.itemId}
          itemType={moveToModal.itemType}
          currentParentId={moveToModal.currentParentId}
          onClose={() => setMoveToModal(null)}
          onSuccess={() => {
            if (onUpdate) onUpdate();
            router.refresh();
          }}
        />
      )}
    </DndContext>
  );
}

function RootDropzone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: "root-dropzone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`mb-6 p-4 border-2 border-dashed rounded-lg text-center transition ${
        isOver
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-gray-50"
      }`}
    >
      <p className="text-gray-600">Drop here to move to root level</p>
    </div>
  );
}
