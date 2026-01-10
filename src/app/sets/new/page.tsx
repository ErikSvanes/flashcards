// src/app/sets/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSets, saveSets, Set } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export default function NewSetPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sets = getSets();
    const newSet: Set = {
      id: uuidv4(),
      name,
      description,
      cards: [],
    };
    saveSets([...sets, newSet]);
    router.push("/"); // Go back to home after saving
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Set</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <label className="block mb-2 font-semibold">Set Name</label>
        <input
          type="text"
          className="w-full p-2 border rounded mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="block mb-2 font-semibold">
          Description (optional)
        </label>
        <textarea
          className="w-full p-2 border rounded mb-4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Save Set
        </button>
      </form>
    </div>
  );
}
