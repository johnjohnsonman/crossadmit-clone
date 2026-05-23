"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/dictionary";
import { withLang } from "@/lib/i18n/locale";

type Props = {
  mentorCount?: number;
};

export default function MentorCtaBox({ mentorCount = 141 }: Props) {
  const searchParams = useSearchParams();
  const locale: Locale = searchParams.get("lang") === "en" ? "en" : "ko";
  const href = withLang("/mentors", locale);

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-white/20 text-xs px-2 py-1 rounded">NEW</span>
        <span className="text-sm opacity-90">
          {locale === "en" ? "Verified mentors" : "검증된 멘토"}
        </span>
      </div>
      <h3 className="text-xl font-bold mb-2">
        {locale === "en"
          ? "Talk to Real Students in Korea"
          : "한국 명문대 학생과 직접 대화"}
      </h3>
      <p className="mb-4 text-sm opacity-90">
        {locale === "en"
          ? `${mentorCount} verified mentors from SNU, Yonsei, Korea Univ, KAIST and more.`
          : `서울대, 연세대, 고려대, 카이스트 등 ${mentorCount}명의 검증된 멘토와 1:1 상담`}
      </p>
      <Link
        href={href}
        className="bg-white text-orange-600 px-4 py-2 rounded font-semibold inline-block hover:bg-gray-100 transition-colors"
      >
        {locale === "en" ? "Browse Mentors →" : "멘토 둘러보기 →"}
      </Link>
    </div>
  );
}
