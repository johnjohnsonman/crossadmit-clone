"use client";

import Link from "next/link";
import type { CrossComparePayload } from "@/lib/crossadmit/comparison-data";
import { withLang } from "@/lib/i18n/locale";

const COPY = {
  ko: {
    admissionsData: "합격 데이터",
    enrolled: "등록",
    avgScore: "평균 스펙",
    viewAdmissions: "합격DB에서 보기 →",
    notInDb: "등록되지 않은 학교",
    crossTitle: "크로스어드밋 비교",
    chose: "선택",
    people: "명",
    bothAdmitted: "명이 두 대학 모두 합격",
    recent: "최근 등록",
    emptyTitle: "아직 이 조합의 비교 데이터가 없어요",
    emptyBody:
      "두 학교 모두 합격한 분이 선택을 인증하면 통계가 쌓여요.",
    emptyCta: "내 학교 등록 인증하기 →",
    similarA: "대신 비교해볼 학교",
    similarB: "대신 비교해볼 학교",
    noSimilar: "추천 학교 준비 중",
    loading: "불러오는 중…",
  },
  en: {
    admissionsData: "Admissions data",
    enrolled: "Enrolled",
    avgScore: "Avg GMAT/SAT",
    viewAdmissions: "View in Admissions DB →",
    notInDb: "School not in database",
    crossTitle: "CrossAdmit comparison",
    chose: "chose",
    people: "",
    bothAdmitted: " admitted to both",
    recent: "Latest",
    emptyTitle: "No comparison data yet for this pairing",
    emptyBody:
      "Statistics appear here once people verify they were admitted to both.",
    emptyCta: "Register My School ↗",
    similarA: "Similar schools to compare",
    similarB: "Similar schools to compare",
    noSimilar: "No suggestions yet",
    loading: "Loading…",
  },
} as const;

type Props = {
  data: CrossComparePayload | null;
  loading?: boolean;
  locale?: "ko" | "en";
  onClear?: () => void;
};

function StatBlock({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] px-3 py-2 text-center">
      <div className="text-[11px] text-[#6B7280]">{label}</div>
      <div className="text-lg font-bold text-[#1A1A1A] tabular-nums">{value}</div>
    </div>
  );
}

function UniversityCard({
  u,
  locale,
}: {
  u: CrossComparePayload["universityA"];
  locale: "ko" | "en";
}) {
  const t = COPY[locale];

  return (
    <div className="rounded-xl border border-[#E5E5E0] bg-white p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-[#1A1A1A] leading-snug">{u.name}</h3>
      <p className="text-xs text-[#6B7280] mt-1">{u.locationLabel}</p>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <StatBlock label={t.admissionsData} value={u.stats.acceptCount} />
        <StatBlock label={t.enrolled} value={u.stats.registCount} />
        <StatBlock
          label={t.avgScore}
          value={u.stats.avgScoreLabel ?? "—"}
        />
      </div>

      <Link
        href={withLang(u.admissionsUrl, locale)}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#2D5A27] text-white text-sm font-semibold px-4 py-2.5 hover:bg-[#244a20] transition-colors"
      >
        {t.viewAdmissions}
      </Link>
    </div>
  );
}

export default function CrossadmitComparisonResult({
  data,
  loading,
  locale = "ko",
  onClear,
}: Props) {
  const t = COPY[locale];

  if (loading) {
    return (
      <div className="rounded-xl border border-[#E5E5E0] bg-white p-12 text-center text-[#6B7280]">
        {t.loading}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-[#E5E5E0] bg-white p-8 text-center">
        <p className="text-[#1A1A1A] font-medium">{t.notInDb}</p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="mt-3 text-sm text-[#2D5A27] underline"
          >
            {locale === "en" ? "Clear" : "초기화"}
          </button>
        )}
      </div>
    );
  }

  const { universityA: uA, universityB: uB, comparison: cmp } = data;
  const registerHref = withLang("/admissions/new", locale);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UniversityCard u={uA} locale={locale} />
        <UniversityCard u={uB} locale={locale} />
      </div>

      <div className="rounded-xl border border-[#E5E5E0] bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">{t.crossTitle}</h3>

        {cmp.hasData ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="font-semibold text-[#1A1A1A]">{uA.name}</span>
                <span className="text-[#6B7280]"> {t.chose} </span>
                <span className="font-bold text-[#2D5A27]">
                  {cmp.choseA}
                  {locale === "ko" ? t.people : ""}
                </span>
                <span className="text-[#6B7280]"> ({cmp.percentageA}%)</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-[#1A1A1A]">{uB.name}</span>
                <span className="text-[#6B7280]"> {t.chose} </span>
                <span className="font-bold text-[#2D5A27]">
                  {cmp.choseB}
                  {locale === "ko" ? t.people : ""}
                </span>
                <span className="text-[#6B7280]"> ({cmp.percentageB}%)</span>
              </div>
            </div>

            <div className="flex h-10 rounded-lg overflow-hidden border border-[#E5E5E0]">
              <div
                className="bg-[#2D5A27] flex items-center justify-center text-white text-xs font-semibold min-w-[2rem] transition-all"
                style={{ width: `${Math.max(cmp.percentageA, 8)}%` }}
              >
                {cmp.percentageA >= 12 ? `${cmp.percentageA}%` : ""}
              </div>
              <div
                className="bg-[#9CA3AF] flex items-center justify-center text-white text-xs font-semibold min-w-[2rem] flex-1"
              >
                {cmp.percentageB >= 12 ? `${cmp.percentageB}%` : ""}
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-[#6B7280]">
              {locale === "ko" ? "총 " : ""}
              <span className="font-semibold text-[#1A1A1A]">
                {cmp.totalDecisions}
                {locale === "ko" ? "명" : ""}
              </span>
              {t.bothAdmitted}
              {cmp.latestAt && (
                <span className="block mt-1 text-xs">
                  {t.recent}:{" "}
                  {new Date(cmp.latestAt).toLocaleDateString(
                    locale === "en" ? "en-US" : "ko-KR"
                  )}
                </span>
              )}
            </p>
          </>
        ) : (
          <div className="text-center py-8 px-4">
            <div className="text-4xl mb-3" aria-hidden>
              📊
            </div>
            <p className="text-lg font-bold text-[#1A1A1A]">{t.emptyTitle}</p>
            <p className="text-sm text-[#6B7280] mt-2 max-w-md mx-auto">
              {t.emptyBody}
            </p>
            <Link
              href={registerHref}
              className="inline-block mt-6 rounded-lg bg-[#2D5A27] text-white font-semibold px-5 py-2.5 hover:bg-[#244a20]"
            >
              {t.emptyCta}
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SimilarChips
          title={`${uA.name} — ${t.similarA}`}
          chips={data.similarA}
          locale={locale}
        />
        <SimilarChips
          title={`${uB.name} — ${t.similarB}`}
          chips={data.similarB}
          locale={locale}
        />
      </div>
    </div>
  );
}

function SimilarChips({
  title,
  chips,
  locale,
}: {
  title: string;
  chips: CrossComparePayload["similarA"];
  locale: "ko" | "en";
}) {
  const t = COPY[locale];
  return (
    <div className="rounded-xl border border-[#E5E5E0] bg-white p-4 shadow-sm">
      <h4 className="text-xs font-semibold text-[#6B7280] mb-3">{title}</h4>
      {chips.length === 0 ? (
        <p className="text-xs text-[#9CA3AF]">{t.noSimilar}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) =>
            c.comparisonSlug ? (
              <Link
                key={c.id}
                href={withLang(`/crossadmit/${c.comparisonSlug}`, locale)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#E5E5E0] bg-[#FAFAF8] text-[#1A1A1A] hover:border-[#2D5A27] hover:text-[#2D5A27] transition-colors"
              >
                {c.name}
              </Link>
            ) : (
              <span
                key={c.id}
                className="text-xs px-3 py-1.5 rounded-full border border-[#E5E5E0] bg-[#FAFAF8] text-[#6B7280]"
              >
                {c.name}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}
