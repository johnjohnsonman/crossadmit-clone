"use client";

import Link from "next/link";
import type { AdmissionRecord } from "@/lib/types";
import { schoolDisplayLines } from "@/lib/supabase/map";
import StatusBadge from "@/components/ui/StatusBadge";

type Props = {
  records: AdmissionRecord[];
  loading?: boolean;
  locale?: "ko" | "en";
  basePath?: string;
  onViewAll: () => void;
};

function PopularCard({
  record,
  basePath,
  locale,
}: {
  record: AdmissionRecord;
  basePath: string;
  locale: "ko" | "en";
}) {
  const lines = schoolDisplayLines(record, locale);
  const regist = lines.find((l) => l.badge === "등록") ?? lines[0];
  const primaryType =
    record.admissionSchools.find((s) => s.isRegist)?.admissionType ||
    record.admissionSchools.find((s) => s.isAccept)?.admissionType ||
    record.admissionSchools[0]?.admissionType ||
    "";
  const likes = record.likesCount ?? 0;
  const moreLabel = locale === "ko" ? "합격 스펙 →" : "View story →";

  return (
    <Link
      href={`${basePath}/${record.id}`}
      className="group flex min-w-[240px] max-w-[280px] shrink-0 flex-col rounded-xl border border-[#E5E5E0] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-w-0 sm:max-w-none sm:flex-1"
    >
      <div className="flex justify-end">
        <span className="text-sm font-semibold text-[#2D5A27] tabular-nums">
          👍 {likes}
        </span>
      </div>

      <div className="mt-3 flex-1">
        <p className="text-base font-semibold tracking-tight text-[#1A1A1A]">
          {record.year}
          {locale === "ko" ? "년" : ""}{" "}
          {primaryType && (
            <span className="font-normal text-[#6B7280]">{primaryType}</span>
          )}
        </p>

        {regist ? (
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <StatusBadge status="enroll" label={regist.badgeLabel} />
            <span className="font-semibold text-[#1A1A1A]">{regist.univ}</span>
            {regist.dept ? (
              <span className="text-sm text-[#6B7280]">{regist.dept}</span>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#9CA3AF]">—</p>
        )}
      </div>

      <p className="mt-4 text-sm font-medium text-[#2D5A27] group-hover:underline">
        {moreLabel}
      </p>
    </Link>
  );
}

export default function PopularAdmissionsSection({
  records,
  loading,
  locale = "ko",
  basePath = "/admissions",
  onViewAll,
}: Props) {
  const title = locale === "ko" ? "🔥 인기 후기" : "🔥 Popular stories";
  const viewAll = locale === "ko" ? "전체보기 →" : "View all →";

  if (loading) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">
            {title}
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="min-w-[240px] h-40 rounded-xl border border-[#E5E5E0] bg-white animate-pulse sm:min-w-0"
            />
          ))}
        </div>
      </section>
    );
  }

  if (records.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-[#2D5A27] hover:underline"
        >
          {viewAll}
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible snap-x snap-mandatory">
        {records.map((record) => (
          <PopularCard
            key={record.id}
            record={record}
            basePath={basePath}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

export function AdmissionsListDivider({
  total,
  locale = "ko",
}: {
  total: number;
  locale?: "ko" | "en";
}) {
  const label =
    locale === "ko"
      ? `전체 후기 ${total.toLocaleString()}건`
      : `${total.toLocaleString()} stories`;

  return (
    <div className="relative flex items-center my-8">
      <div className="flex-1 border-t border-[#E5E5E0]" />
      <span className="px-4 text-xs font-medium text-[#9CA3AF] whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 border-t border-[#E5E5E0]" />
    </div>
  );
}
