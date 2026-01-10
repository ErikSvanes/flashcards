// src/components/SetView.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSets, Set } from "@/lib/storage";
import CardManager from "@/components/CardManager";
import ImportModal from "./ImportModal";
import StudySetupModal from "./StudySetupModal";

export default function SetView({ setId }: { setId: string }) {
  const router = useRouter();
  const [set, setSet] = useState<Set | null>(null);
  const [allSets, setAllSets] = useState<Set[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [showStudySetup, setShowStudySetup] = useState(false);

  useEffect(() => {
    const sets = getSets();
    const currentSet = sets.find((s) => s.id === setId);
    if (!currentSet) router.push("/");
    else {
      setSet(currentSet);
      setAllSets(sets);
    }
  }, [setId, router]);

  if (!set) return <p>Loading...</p>;

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{set.name}</h1>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          Import Cards
        </button>
        <button
          onClick={() => setShowStudySetup(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Start Flashcards
        </button>
      </header>

      <section className="mb-6">
        <p className="text-gray-600">
          {set.description || "No description for this set yet."}
        </p>
        <p className="text-gray-500 mt-1">
          {set.cards.length} card{set.cards.length !== 1 ? "s" : ""}
        </p>
      </section>

      <CardManager set={set} setSet={setSet} />

      {/* Import Modal */}
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        targetSet={set}
        onImportComplete={(newSet) => setSet(newSet)}
      />

      {/* Study Setup Modal */}
      <StudySetupModal
        open={showStudySetup}
        onClose={() => setShowStudySetup(false)}
        currentSet={set}
        allSets={allSets}
      />
    </div>
  );
}
