import { Suspense } from "react";
import StudyForumBoard from "@/components/forum/StudyForumBoard";

export const metadata = {
  title: "Study Korea Forum | CrossAdmit",
  description:
    "Share Korean study abroad experiences and information — Naver, Reddit, Quora, official sources",
};

function ForumFallback() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-8">
      <p className="text-[#6B7280] text-sm">Loading…</p>
    </div>
  );
}

export default function ForumPageEN() {
  return (
    <Suspense fallback={<ForumFallback />}>
      <StudyForumBoard locale="en" />
    </Suspense>
  );
}
