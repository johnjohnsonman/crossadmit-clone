"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdmissionRecord } from "@/lib/types";
import AdmitTrackBadge from "@/components/admissions/AdmitTrackBadge";
import DegreeLevelBadge from "@/components/admissions/DegreeLevelBadge";
type Props = {
  locale: "ko" | "en";
  hrefForId: (id: string) => string;
};

function scoreSnippet(record: AdmissionRecord): string {
  const s = record.inputScore?.trim();
  if (s) {
    const first = s.split("\n")[0];
    return first.length > 48 ? `${first.slice(0, 48)}…` : first;
  }
  return record.inputGpa?.trim() || "—";
}

function FeaturedCard({
  record,
  href,
  locale,
}: {
  record: AdmissionRecord;
  href: string;
  locale: "ko" | "en";
}) {
  const enrolled = record.admissionSchools.find((s) => s.isRegist);
  const top =
    enrolled?.univName ||
    record.admissionSchools.find((s) => s.isAccept)?.univName ||
    record.title;

  return (
    <Link
      href={href}
      className="flex flex-col rounded-xl border border-[#343536] bg-[#1A1A1B] p-5 transition-all hover:border-orange-500/40 hover:bg-[#232326] min-h-[180px]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <AdmitTrackBadge track={record.admitTrack} locale={locale} />
        <DegreeLevelBadge level={record.degreeLevel} locale={locale} />
        {record.isVerified && (
          <span className="text-[10px] font-semibold text-orange-300 border border-orange-500/30 rounded-full px-2 py-0.5">
            Verified
          </span>
        )}
      </div>
      <p className="mt-3 text-lg font-bold text-[#D7DADC] line-clamp-2">{top}</p>
      <p className="mt-1 text-sm text-[#7C7C7C] tabular-nums">{record.year}</p>
      <p className="mt-3 text-xs text-[#9CA3AF] font-mono bg-[#272729] rounded px-2 py-1 border border-[#343536]">
        {scoreSnippet(record)}
      </p>
      <p className="mt-auto pt-4 text-sm font-semibold text-orange-400">
        Read full story →
      </p>
    </Link>
  );
}

export default function FeaturedIntlStories({ locale, hrefForId }: Props) {
  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admissions?featured=1&limit=4`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (!cancelled) setRecords([]);
          return;
        }
        const json = await res.json();
        if (!cancelled) setRecords(json.data ?? []);
      } catch {
        if (!cancelled) setRecords([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (locale !== "en") return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#D7DADC]">Featured stories</h2>
      <p className="mt-1 text-sm text-[#7C7C7C]">
        International & overseas Korean admission journeys
      </p>
      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[180px] rounded-xl border border-[#343536] bg-[#1A1A1B] animate-pulse"
            />
          ))}
        </div>
      ) : records.length === 0 ? null : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {records.map((r) => (
              <FeaturedCard
                key={r.id}
                record={r}
                href={hrefForId(String(r.id))}
                locale={locale}
              />
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-[#343536] bg-[#1A1A1B] px-4 py-3 text-sm text-[#7C7C7C] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>Want to share your journey?</p>
            <Link
              href="/admissions/new?lang=en"
              className="font-semibold text-orange-400 hover:underline"
            >
              Submit your story →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
