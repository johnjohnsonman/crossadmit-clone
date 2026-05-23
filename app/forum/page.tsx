import { Suspense } from "react";
import StudyForumBoard from "@/components/forum/StudyForumBoard";
import { getDictionary } from "@/lib/i18n/dictionary";
import { resolveLocale } from "@/lib/i18n/locale";

export const metadata = {
  title: "유학 포럼 | CrossAdmit",
  description: "Study in Korea forum — Naver, Reddit, Quora, official sources",
};

function ForumFallback() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <p className="text-[#6B7280] text-sm">불러오는 중…</p>
    </div>
  );
}

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function ForumPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = resolveLocale(sp.lang);
  const dict = getDictionary(locale);

  return (
    <Suspense fallback={<ForumFallback />}>
      <StudyForumBoard locale={locale} dict={dict} />
    </Suspense>
  );
}
