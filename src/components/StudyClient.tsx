// src/components/StudyClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/hybridStorage";
import { StudySession } from "@/lib/studyTypes";
import StandardMode from "./study/StandardMode";
import InfiniteMode from "./study/InfiniteMode";
import GroupedMode from "./study/GroupedMode";

export default function StudyClient({ setId }: { setId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);

  // Disable scrolling on the entire page while in study mode
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const savedSession = getSession(setId);

    if (!savedSession) {
      // No session found, redirect to set page to configure
      router.push(`/sets/${setId}`);
    } else {
      setSession(savedSession);
      setLoading(false);
    }
  }, [setId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  // Route to appropriate mode component
  if (session.mode === "standard") {
    return (
      <StandardMode
        setId={setId}
        session={session}
        setSession={setSession}
      />
    );
  }

  if (session.mode === "infinite") {
    return (
      <InfiniteMode
        setId={setId}
        session={session}
        setSession={setSession}
      />
    );
  }

  if (session.mode === "grouped") {
    return (
      <GroupedMode
        setId={setId}
        session={session}
        setSession={setSession}
      />
    );
  }

  return null;
}
