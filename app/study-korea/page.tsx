import type { Metadata } from "next";
import { Suspense } from "react";
import StudyKoreaGuide from "@/components/study-korea/StudyKoreaGuide";
import { resolveLocale } from "@/lib/i18n/locale";
import { seoAlternates } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return {
    title: "한국 유학 가이드 | CrossAdmit",
    description: "Study in Korea tips from Reddit, Naver, and official sources",
    alternates: seoAlternates("/study-korea"),
  };
}

function StudyKoreaFallback() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400 text-sm">불러오는 중…</p>
    </div>
  );
}

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function StudyKoreaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = resolveLocale(sp.lang);

  return (
    <Suspense fallback={<StudyKoreaFallback />}>
      <StudyKoreaGuide locale={locale} />
    </Suspense>
  );
}
