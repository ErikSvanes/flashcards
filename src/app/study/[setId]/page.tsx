// src/app/study/[setId]/page.tsx
import StudyClient from "@/components/StudyClient";

interface StudyPageProps {
  params: Promise<{ setId: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { setId } = await params;
  return <StudyClient setId={setId} />;
}
