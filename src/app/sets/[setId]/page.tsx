// src/app/sets/[setId]/page.tsx
import SetView from "@/components/SetView";
import { PAGE_MAX_WIDTH } from "@/lib/constants";

interface SetPageProps {
  params: Promise<{ setId: string }>; // Next.js now types it as a Promise
}

export default async function SetPage({ params }: SetPageProps) {
  const { setId } = await params;
  return (
    <div className="min-h-screen bg-gray-100">
      <div className={`${PAGE_MAX_WIDTH} mx-auto p-6`}>
        <SetView setId={setId} />
      </div>
    </div>
  );
}
