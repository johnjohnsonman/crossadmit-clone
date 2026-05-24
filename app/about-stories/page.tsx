import Link from "next/link";
import { resolveLocale } from "@/lib/i18n/locale";
import { withLang } from "@/lib/i18n/locale";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

const COPY = {
  en: {
    title: "Why share your story?",
    paragraphs: [
      "Thousands of international students dream of studying in Korea — but realistic admission profiles are hard to find. Your experience fills that gap.",
      "We never publish legal names. Use a nickname, share only what you are comfortable with, and focus on outcomes and lessons learned.",
      "Every story helps the next applicant understand tracks, scores, and school choices that actually worked for someone like them.",
      "It takes about 10 minutes. You can upload an optional admission letter screenshot for a verified badge.",
    ],
    cta: "Share your story →",
    back: "← Admissions DB",
  },
  ko: {
    title: "왜 합격 후기를 남기나요?",
    paragraphs: [
      "한국 유학을 꿈꾸는 학생들에게는 현실적인 합격 스펙과 후기가 부족합니다. 여러분의 경험이 그 공백을 채웁니다.",
      "실명은 공개하지 않습니다. 닉네임으로 익명 등록이 가능하며, 공유할 내용만 선택하면 됩니다.",
      "한 명의 후기가 다음 지원자의 학교 선택과 전형 준비에 실질적인 도움이 됩니다.",
      "약 10분이면 등록할 수 있습니다. 합격 통지 스크린샷을 올리면 인증 배지를 받을 수 있습니다.",
    ],
    cta: "후기 등록하기 →",
    back: "← 합격DB",
  },
};

export default async function AboutStoriesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = resolveLocale(sp.lang);
  const t = COPY[locale];

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Link
          href={withLang("/admissions", locale)}
          className="text-sm font-medium text-[#2D5A27] hover:underline"
        >
          {t.back}
        </Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">{t.title}</h1>
        <div className="mt-6 space-y-4 text-[#6B7280] leading-relaxed">
          {t.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <Link
          href={withLang("/admissions/new", locale)}
          className="mt-10 inline-flex rounded-lg bg-orange-500 px-6 py-3 text-base font-semibold text-white hover:bg-orange-600"
        >
          {t.cta}
        </Link>
      </div>
    </main>
  );
}
