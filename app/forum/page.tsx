import { Suspense } from "react";
import type { Metadata } from "next";
import RedditForumHome from "@/components/reddit-style/RedditForumHome";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo/metadata";

const title = "Forum - Study in Korea Community";
const description =
  "Reddit-style community for international students in Korea. Ask questions about visa, admissions, dorm life, scholarships, TOPIK, and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: seoAlternates("/forum"),
  openGraph: seoOpenGraph({
    title: "Forum | CrossAdmit",
    description: "Community for international students studying in Korea",
    type: "website",
    url: "https://crossadmit.com/forum",
  }),
  twitter: seoTwitter("Forum | CrossAdmit", description),
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
