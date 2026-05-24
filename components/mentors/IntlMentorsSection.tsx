import Link from "next/link";
import type { AdmissionRecord } from "@/lib/types";
import IntlMentorCard from "@/components/mentors/IntlMentorCard";
import { withLang } from "@/lib/i18n/locale";

type Props = {
  mentors: AdmissionRecord[];
  locale: "ko" | "en";
  compact?: boolean;
};

const COPY = {
  en: {
    title: "🌏 International applicants community",
    subtitle:
      "Connect with students who've been through Korean university admissions as international applicants.",
    empty:
      "No mentors yet — be the first to share your journey and help future applicants.",
    cta: "Share your story →",
    krLink: "Browse verified Korean mentors →",
  },
  ko: {
    title: "🌏 국제 학생 멘토",
    subtitle:
      "한국 대학 국제 전형을 경험한 선배들과 연결하세요. (합격 후기 옵트인)",
    empty:
      "아직 멘토가 없습니다. 첫 번째로 여정을 공유하고 후배들을 도와주세요.",
    cta: "후기 등록하기 →",
    krLink: "검증된 국내 멘토 보기 ↓",
  },
};

export default function IntlMentorsSection({
  mentors,
  locale,
  compact = false,
}: Props) {
  const t = COPY[locale];

  return (
    <section
      className={
        compact
          ? "mb-8 rounded-xl border border-gray-800 bg-[#FAFAF8]/5 p-5"
          : "mb-10"
      }
    >
      <header className={compact ? "mb-4" : "mb-6"}>
        <h2
          className={
            compact
              ? "text-lg font-bold text-white"
              : "text-2xl font-bold text-white"
          }
        >
          {t.title}
        </h2>
        <p
          className={`mt-2 leading-relaxed ${
            compact
              ? "text-sm text-gray-400"
              : "text-base max-w-2xl text-gray-400"
          }`}
        >
          {t.subtitle}
        </p>
      </header>

      {mentors.length === 0 ? (
        <div className="rounded-xl border border-[#E5E5E0] bg-white px-6 py-12 text-center">
          <p className="text-[#1A1A1A] font-medium">{t.empty}</p>
          <Link
            href={withLang("/admissions/new?lang=en", locale)}
            className="mt-6 inline-flex rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            {t.cta}
          </Link>
        </div>
      ) : (
        <div
          className={
            compact
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          }
        >
          {mentors.map((m) => (
            <IntlMentorCard key={m.id} record={m} locale={locale} />
          ))}
        </div>
      )}

      {locale === "en" && !compact ? (
        <p className="mt-6 text-center text-sm text-gray-500">
          <a href="#kr-mentors" className="text-orange-400 hover:underline">
            {t.krLink}
          </a>
        </p>
      ) : null}
    </section>
  );
}
