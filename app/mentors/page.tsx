import { Suspense } from "react";
import type { Metadata } from "next";
import MentorsDirectory from "@/components/mentors/MentorsDirectory";
import {
  fetchMentors,
  getActiveMentorCount,
  MENTOR_PAGE_SIZE,
} from "@/lib/mentors/queries";
import type { Locale } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Verified Mentors for Study in Korea | CrossAdmit",
  description:
    "141+ verified mentors from SNU, Yonsei, Korea University, KAIST and more. Get 1:1 admission and career advice from real students in Korea.",
  openGraph: {
    title: "Verified Mentors | CrossAdmit",
    type: "website",
    url: "https://crossadmit.com/mentors",
  },
  alternates: { canonical: "https://crossadmit.com/mentors" },
};

type Props = {
  searchParams: Promise<{
    q?: string;
    country?: string;
    offers?: string;
    price?: string;
    sort?: string;
    page?: string;
    lang?: string;
  }>;
};

export default async function MentorsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale: Locale = sp.lang === "en" ? "en" : "ko";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [mentorCount, result] = await Promise.all([
    getActiveMentorCount(),
    fetchMentors({
      q: sp.q,
      country: sp.country,
      offers: sp.offers,
      price: sp.price,
      sort: sp.sort ?? "popular",
      page,
      limit: MENTOR_PAGE_SIZE,
    }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center text-gray-400">
          Loading mentors…
        </div>
      }
    >
      <MentorsDirectory
        initialMentors={result.mentors}
        initialTotal={result.total}
        initialPage={page}
        mentorCount={mentorCount}
        locale={locale}
      />
    </Suspense>
  );
}
