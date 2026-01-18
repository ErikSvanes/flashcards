// src/components/Breadcrumbs.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder } from "@/lib/storage";
import { getFolderPath } from "@/lib/hybridStorage";

interface BreadcrumbsProps {
  currentFolderId: string | null;
  className?: string;
}

export default function Breadcrumbs({
  currentFolderId,
  className = "",
}: BreadcrumbsProps) {
  const [path, setPath] = useState<Folder[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getFolderPath(currentFolderId).then(setPath);
  }, [currentFolderId]);

  // Don't render breadcrumbs until mounted on client to avoid hydration mismatch
  if (!mounted) {
    return <div className={className} style={{ height: '1.25rem' }} />; // Placeholder with same height
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      <Link
        href="/"
        className="hover:text-gray-900 hover:underline transition"
      >
        Home
      </Link>

      {path.map((folder) => (
        <span key={folder.id} className="flex items-center gap-2">
          <span className="text-gray-400">/</span>
          <Link
            href={`/?folderId=${folder.id}`}
            className="hover:text-gray-900 hover:underline transition"
          >
            {folder.name}
          </Link>
        </span>
      ))}
    </div>
  );
}
