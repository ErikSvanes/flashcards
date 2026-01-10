// src/components/SetList.tsx
import Link from "next/link";
import { Set } from "@/lib/storage";

export default function SetList({ sets }: { sets: Set[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {sets.map((set) => (
        <Link
          key={set.id}
          href={`/sets/${set.id}`}
          className="p-4 bg-white rounded shadow hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold text-gray-800">{set.name}</h2>
          {set.description && (
            <p className="text-gray-600 mt-2">{set.description}</p>
          )}
          <p className="text-gray-400 mt-2 text-sm">
            {set.cards.length} {set.cards.length == 1 ? "card" : "cards"}
          </p>
        </Link>
      ))}
    </div>
  );
}
