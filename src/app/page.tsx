// src/app/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getItemsInFolder, addFolder } from "@/lib/hybridStorage";
import { FolderItem } from "@/lib/storage";
import { PAGE_MAX_WIDTH } from "@/lib/constants";
import FolderList from "@/components/FolderList";
import Breadcrumbs from "@/components/Breadcrumbs";

function HomePageContent() {
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get("folderId") || null;
  const [items, setItems] = useState<FolderItem[]>([]);

  const refreshItems = async () => {
    const items = await getItemsInFolder(currentFolderId);
    setItems(items);
  };

  useEffect(() => {
    refreshItems();
  }, [currentFolderId]);

  const handleNewFolder = async () => {
    const name = prompt("Enter folder name:");
    if (name && name.trim()) {
      await addFolder(name.trim(), currentFolderId);
      refreshItems();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className={`p-6 ${PAGE_MAX_WIDTH} mx-auto`}>
        <Breadcrumbs currentFolderId={currentFolderId} className="mb-4" />

        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            {currentFolderId ? "Folder Contents" : "My Flashcard Sets"}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleNewFolder}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              + New Folder
            </button>
            <Link
              href={currentFolderId ? `/sets/new?parentId=${currentFolderId}` : "/sets/new"}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              + Add New Set
            </Link>
          </div>
        </header>

        {items.length === 0 ? (
          <p className="text-gray-600">
            {currentFolderId
              ? "This folder is empty. Add a set or subfolder to get started."
              : "No sets yet. Click \"Add New Set\" to get started!"}
          </p>
        ) : (
          <FolderList
            items={items}
            currentFolderId={currentFolderId}
            onUpdate={refreshItems}
          />
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
