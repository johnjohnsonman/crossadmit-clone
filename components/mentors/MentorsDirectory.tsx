"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/dictionary";
import { withLang } from "@/lib/i18n/locale";
import type { MentorRow } from "@/lib/mentors/types";
import type { AdmissionRecord } from "@/lib/types";
import IntlMentorsSection from "@/components/mentors/IntlMentorsSection";
import MentorCard from "./MentorCard";

type Props = {
  initialMentors: MentorRow[];
  initialTotal: number;
  initialPage: number;
  mentorCount: number;
  intlMentors: AdmissionRecord[];
  locale: Locale;
};

const PAGE_SIZE = 24;

export default function MentorsDirectory({
  initialMentors,
  initialTotal,
  initialPage,
  mentorCount,
  intlMentors,
  locale,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mentors, setMentors] = useState(initialMentors);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const country = searchParams.get("country") ?? "all";
  const offers = searchParams.get("offers") ?? "all";
  const price = searchParams.get("price") ?? "all";
  const sort = searchParams.get("sort") ?? "popular";

  const buildUrl = useCallback(
    (patch: Record<string, string | number>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === "" || v === "all") p.delete(k);
        else p.set(k, String(v));
      }
      const qs = p.toString();
      return withLang(`/mentors${qs ? `?${qs}` : ""}`, locale);
    },
    [searchParams, locale]
  );

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchParams.get("q")) params.set("q", searchParams.get("q")!);
    if (country !== "all") params.set("country", country);
    if (offers !== "all") params.set("offers", offers);
    if (price !== "all") params.set("price", price);
    if (sort !== "popular") params.set("sort", sort);
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/mentors/search?${params}`);
      const json = await res.json();
      if (res.ok) {
        setMentors(json.mentors ?? []);
        setTotal(json.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams, country, offers, price, sort, page]);

  useEffect(() => {
    void fetchMentors();
  }, [fetchMentors]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      const current = searchParams.get("q") ?? "";
      if (q === current) return;
      router.push(buildUrl({ q, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, searchParams, router, buildUrl]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 5);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  const title =
    locale === "en"
      ? `${mentorCount} Verified Mentors`
      : `검증된 멘토 ${mentorCount}명`;
  const subtitle =
    locale === "en"
      ? "Talk directly with students from SNU, Yonsei, Korea University, KAIST and more"
      : "한국 명문대 재학생/졸업생과 직접 대화하기";

  const showKrMentors = locale === "ko";

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {locale === "en" ? (
          <>
            <header className="mb-6">
              <h1 className="text-3xl font-bold">Mentors</h1>
              <p className="mt-2 text-gray-400 max-w-2xl">
                Peer mentors from international, GKS, and overseas Korean admission
                tracks — reach out through their stories.
              </p>
            </header>
            <IntlMentorsSection mentors={intlMentors} locale={locale} />
          </>
        ) : (
          <>
            <IntlMentorsSection
              mentors={intlMentors}
              locale={locale}
              compact
            />
            <header id="kr-mentors" className="mb-8 pt-4 border-t border-gray-800">
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-2 text-gray-400">{subtitle}</p>
            </header>
          </>
        )}

        {showKrMentors ? (
        <div className="sticky top-14 z-30 bg-[#0f0f10]/95 backdrop-blur border border-gray-800 rounded-lg p-4 mb-6 space-y-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              locale === "en"
                ? "Search school or nickname…"
                : "학교명 또는 닉네임 검색…"
            }
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="flex flex-wrap gap-2">
            <FilterSelect
              label={locale === "en" ? "Country" : "국가"}
              value={country}
              onChange={(v) => router.push(buildUrl({ country: v, page: 1 }))}
              options={[
                ["all", locale === "en" ? "All" : "전체"],
                ["kr", "🇰🇷 Korea"],
                ["us", "🇺🇸 USA"],
                ["gb", "🇬🇧 UK"],
                ["other", locale === "en" ? "Other" : "기타"],
              ]}
            />
            <FilterSelect
              label={locale === "en" ? "Field" : "분야"}
              value={offers}
              onChange={(v) => router.push(buildUrl({ offers: v, page: 1 }))}
              options={[
                ["all", "All"],
                ["admission", "Admission"],
                ["career", "Career"],
                ["free", "Free"],
              ]}
            />
            <FilterSelect
              label={locale === "en" ? "Price" : "가격"}
              value={price}
              onChange={(v) => router.push(buildUrl({ price: v, page: 1 }))}
              options={[
                ["all", "All"],
                ["free", "Free"],
                ["1-30", "$1–30"],
                ["30-100", "$30–100"],
                ["100+", "$100+"],
              ]}
            />
            <FilterSelect
              label={locale === "en" ? "Sort" : "정렬"}
              value={sort}
              onChange={(v) => router.push(buildUrl({ sort: v, page: 1 }))}
              options={[
                ["popular", "Popular"],
                ["newest", "Newest"],
                ["price_asc", "Price Low"],
                ["price_desc", "Price High"],
              ]}
            />
          </div>
        </div>
        ) : null}

        {showKrMentors && loading ? (
          <p className="text-center text-gray-500 py-12">Loading…</p>
        ) : showKrMentors && mentors.length === 0 ? (
          <p className="text-center text-gray-500 py-12">멘토가 없습니다.</p>
        ) : showKrMentors ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((m) => (
              <MentorCard key={m.id} mentor={m} locale={locale} />
            ))}
          </div>
        ) : null}

        {showKrMentors ? (
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-gray-400">
            {locale === "en"
              ? `Showing ${from}–${to} of ${total} mentors`
              : `${total}명 중 ${from}–${to}명 표시`}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <PaginationBtn
              disabled={page <= 1}
              onClick={() => router.push(buildUrl({ page: page - 1 }))}
            >
              Prev
            </PaginationBtn>
            {pageNumbers.map((n) => (
              <PaginationBtn
                key={n}
                active={n === page}
                onClick={() => router.push(buildUrl({ page: n }))}
              >
                {n}
              </PaginationBtn>
            ))}
            <PaginationBtn
              disabled={page >= totalPages}
              onClick={() => router.push(buildUrl({ page: page + 1 }))}
            >
              Next
            </PaginationBtn>
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="text-xs text-gray-400 flex flex-col gap-1">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded bg-gray-900 border border-gray-700 text-white text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function PaginationBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-w-[2.5rem] px-3 py-1.5 rounded text-sm font-medium ${
        active
          ? "bg-orange-500 text-white"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40"
      }`}
    >
      {children}
    </button>
  );
}
