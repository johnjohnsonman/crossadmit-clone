import { Suspense } from "react";
import StudyKoreaGuide from "@/components/study-korea/StudyKoreaGuide";

export const metadata = {
  title: "Study in Korea Guide | CrossAdmit",
  description: "Curated study-in-Korea resources",
};

function StudyKoreaFallback() {
  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-8">
      <p className="text-sage-600 text-sm">Loading…</p>
    </div>
  );
}

export default function StudyKoreaENPage() {
  return (
    <Suspense fallback={<StudyKoreaFallback />}>
      <StudyKoreaGuide locale="en" />
    </Suspense>
  );
}
