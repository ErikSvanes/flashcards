// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSets, Set } from "@/lib/storage";
import { PAGE_MAX_WIDTH } from "@/lib/constants";
import SetList from "@/components/SetList";

export default function HomePage() {
  const [sets, setSets] = useState<Set[]>([]);

  useEffect(() => {
    setSets(getSets());
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className={`p-6 ${PAGE_MAX_WIDTH} mx-auto`}>
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            My Flashcard Sets
          </h1>
          <Link
            href="/sets/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            + Add New Set
          </Link>
        </header>

        {sets.length === 0 ? (
          <p className="text-gray-600">
            No sets yet. Click "Add New Set" to get started!
          </p>
        ) : (
          <SetList sets={sets} />
        )}
      </main>
    </div>
  );
}
