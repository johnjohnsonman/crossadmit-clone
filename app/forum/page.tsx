import { Suspense } from "react";
import type { Metadata } from "next";
import RedditForumHome from "@/components/reddit-style/RedditForumHome";

export const metadata: Metadata = {
  title: "Study in Korea Forum for International Students | CrossAdmit",
  description:
    "Reddit-style forum for foreigners studying in Korea — visa, admissions, scholarships, dorm life, TOPIK, and campus tips curated from trusted sources.",
  openGraph: {
    title: "Study in Korea Forum | CrossAdmit",
    description:
      "Visa, admissions, scholarships & campus life for international students in Korea.",
    type: "website",
    url: "https://crossadmit.com/forum",
  },
  alternates: {
    canonical: "https://crossadmit.com/forum",
  },
};

function ForumFallback() {
  return (
    <div className="min-h-screen bg-[#DAE0E6] flex items-center justify-center">
      <p className="text-[#7C7C7C] text-sm">Loading forum…</p>
    </div>
  );
}

export default function ForumPage() {
  return (
    <Suspense fallback={<ForumFallback />}>
      <RedditForumHome />
    </Suspense>
  );
}
