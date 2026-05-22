"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdmissionRecord } from "@/lib/types";
import { schoolDisplayLines } from "@/lib/supabase/map";

const PAGE_SIZE = 20;

const TEXT = {
  ko: {
    title: "합격DB",
    subtitle: "합격 스펙 및 후기를 공유하고 볼 수 있습니다",
    register: "✏️ 합격 후기 등록하기",
    searchSchool: "학교 검색",
    yearAll: "전체",
    yearBefore: "2019이전",
    typeAll: "전체",
    types: ["수시", "정시", "편입", "논술", "기타"],
    statusAll: "전체",
    statuses: [
      { value: "accept", label: "합격" },
      { value: "regist", label: "등록" },
      { value: "reject", label: "불합격" },
    ],
    sortLatest: "최신순",
    sortLikes: "공감순",
    sortViews: "조회순",
    searchBtn: "검색",
    total: (n: number) => `전체 ${n.toLocaleString()}건`,
    filtered: (q: string, n: number) =>
      `${q} ${n.toLocaleString()}건`,
    loading: "불러오는 중...",
    empty: "조건에 맞는 합격 후기가 없습니다.",
    resetFilters: "필터 초기화",
    featured: "⭐ 상단 고정",
    more: "합격 스펙 및 후기 더보기 →",
    likes: "공감",
    prev: "이전",
    next: "다음",
    anonymous: "익명",
  },
  en: {
    title: "Admissions DB",
    subtitle: "Browse admission specs and student reviews",
    register: "✏️ Submit Your Story",
    searchSchool: "Search school",
    yearAll: "All years",
    yearBefore: "Before 2019",
    typeAll: "All types",
    types: ["Early", "Regular", "Transfer", "Essay", "Other"],
    statusAll: "All status",
    statuses: [
      { value: "accept", label: "Accept" },
      { value: "regist", label: "Enrolled" },
      { value: "reject", label: "Rejected" },
    ],
    sortLatest: "Latest",
    sortLikes: "Most likes",
    sortViews: "Most views",
    searchBtn: "Search",
    total: (n: number) => `${n.toLocaleString()} total`,
    filtered: (q: string, n: number) =>
      `${q} · ${n.toLocaleString()} results`,
    loading: "Loading...",
    empty: "No admission stories match your filters.",
    resetFilters: "Clear filters",
    featured: "⭐ Featured",
    more: "View specs & review →",
    likes: "likes",
    prev: "Previous",
    next: "Next",
    anonymous: "Anonymous",
  },
} as const;

const YEAR_OPTIONS = ["", "2024", "2023", "2022", "2021", "2020", "before2019"];
const TYPE_OPTIONS: { value: string; ko: string; en: string }[] = [
  { value: "", ko: "전체", en: "All types" },
  { value: "수시", ko: "수시", en: "Early admission" },
  { value: "정시", ko: "정시", en: "Regular admission" },
  { value: "편입", ko: "편입", en: "Transfer" },
  { value: "논술", ko: "논술", en: "Essay" },
  { value: "기타", ko: "기타", en: "Other" },
];

const selectClass =
  "min-w-[110px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 " +
  "shadow-sm hover:border-tea-500 focus:border-tea-600 focus:outline-none focus:ring-2 focus:ring-tea-500/30";

const LIKED_LS = "adliked:";

function statusBadgeClasses(badge: string): string {
  if (badge === "등록" || badge === "Enrolled") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (badge === "합격" || badge === "Accept") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }
  return "border-gray-200 bg-gray-100 text-gray-600";
}

function AdmissionLikeButton({
  admissionId,
  initialCount,
  locale,
}: {
  admissionId: number;
  initialCount: number;
  locale: "ko" | "en";
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = TEXT[locale];

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(LIKED_LS + String(admissionId)) === "1");
    } catch {
      setLiked(false);
    }
  }, [admissionId]);

  const onClick = async () => {
    if (liked || busy) return;
    const prev = count;
    setBusy(true);
    setCount((c) => c + 1);
    try {
      const res = await fetch(
        `/api/admissions/${encodeURIComponent(admissionId)}/like`,
        { method: "POST", credentials: "include" }
      );
      const data = (await res.json()) as { likes_count?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "fail");
      if (typeof data.likes_count === "number") setCount(data.likes_count);
      setLiked(true);
      try {
        localStorage.setItem(LIKED_LS + String(admissionId), "1");
      } catch {
        /* ignore */
      }
    } catch {
      setCount(prev);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={liked || busy}
      onClick={() => void onClick()}
      className="text-sm text-gray-700 hover:text-tea-700 disabled:opacity-60"
    >
      👍 {count} {t.likes}
    </button>
  );
}

function PageNumbers({
  current,
  totalPages,
  onSelect,
}: {
  current: number;
  totalPages: number;
  onSelect: (p: number) => void;
}) {
  const pages: (number | "ellipsis")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= current - 2 && p <= current + 2)
    ) {
      pages.push(p);
    } else if (p === current - 3 || p === current + 3) {
      pages.push("ellipsis");
    }
  }
  const deduped = pages.filter(
    (p, i) => p !== "ellipsis" || pages[i - 1] !== "ellipsis"
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {deduped.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            className={`min-w-[2.25rem] rounded-md border px-2 py-1 text-sm ${
              p === current
                ? "border-tea-600 bg-tea-50 font-semibold text-tea-900"
                : "border-gray-200 bg-white text-gray-700 hover:border-tea-400"
            }`}
          >
            {p}
          </button>
        )
      )}
    </div>
  );
}

export default function AdmissionsBulletinBoard({
  locale = "ko",
}: {
  locale?: "ko" | "en";
}) {
  const t = TEXT[locale];
  const basePath = locale === "en" ? "/en/admissions" : "/admissions";

  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [draftSearch, setDraftSearch] = useState("");
  const [draftYear, setDraftYear] = useState("");
  const [draftType, setDraftType] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftSort, setDraftSort] = useState<"latest" | "likes" | "views">(
    "latest"
  );

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedYear, setAppliedYear] = useState("");
  const [appliedType, setAppliedType] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedSort, setAppliedSort] = useState<"latest" | "likes" | "views">(
    "latest"
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;

  const countLabel = useMemo(() => {
    if (appliedSearch.trim()) {
      return t.filtered(appliedSearch.trim(), total);
    }
    return t.total(total);
  }, [appliedSearch, total, t]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        sort: appliedSort,
      });
      if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
      if (appliedYear) params.set("year", appliedYear);
      if (appliedType) params.set("admission_type", appliedType);
      if (appliedStatus) params.set("status", appliedStatus);

      const res = await fetch(`/api/admissions?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setRecords([]);
        setTotal(0);
        return;
      }
      const json = await res.json();
      setRecords(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, appliedSearch, appliedYear, appliedType, appliedStatus, appliedSort]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const applyFilters = () => {
    setAppliedSearch(draftSearch);
    setAppliedYear(draftYear);
    setAppliedType(draftType);
    setAppliedStatus(draftStatus);
    setAppliedSort(draftSort);
    setPage(1);
  };

  const resetFilters = () => {
    setDraftSearch("");
    setDraftYear("");
    setDraftType("");
    setDraftStatus("");
    setDraftSort("latest");
    setAppliedSearch("");
    setAppliedYear("");
    setAppliedType("");
    setAppliedStatus("");
    setAppliedSort("latest");
    setPage(1);
  };

  const empty = !loading && records.length === 0;

  return (
    <main className="min-h-screen bg-[#f5f4f0]">
      <div className="border-b border-sage-200/80 bg-white shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {t.title}
              </h1>
              <p className="mt-2 text-gray-600">{t.subtitle}</p>
            </div>
            <Link
              href={locale === "en" ? "/admissions/new" : "/admissions/new"}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-tea-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-tea-700"
            >
              {t.register}
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              {t.searchSchool}
            </label>
            <input
              type="text"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder={t.searchSchool}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-tea-600 focus:outline-none focus:ring-2 focus:ring-tea-500/30"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              {locale === "en" ? "Year" : "연도"}
            </label>
            <select
              className={selectClass}
              value={draftYear}
              onChange={(e) => setDraftYear(e.target.value)}
            >
              <option value="">{t.yearAll}</option>
              {YEAR_OPTIONS.filter((y) => y && y !== "before2019").map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
              <option value="before2019">{t.yearBefore}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              {locale === "en" ? "Type" : "전형"}
            </label>
            <select
              className={selectClass}
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {locale === "en" ? opt.en : opt.ko}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              {locale === "en" ? "Status" : "상태"}
            </label>
            <select
              className={selectClass}
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              <option value="">{t.statusAll}</option>
              {t.statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              {locale === "en" ? "Sort" : "정렬"}
            </label>
            <select
              className={selectClass}
              value={draftSort}
              onChange={(e) =>
                setDraftSort(e.target.value as "latest" | "likes" | "views")
              }
            >
              <option value="latest">{t.sortLatest}</option>
              <option value="likes">{t.sortLikes}</option>
              <option value="views">{t.sortViews}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-tea-600 px-5 py-2 text-sm font-semibold text-white hover:bg-tea-700"
          >
            {t.searchBtn}
          </button>
        </div>

        <p className="mb-4 text-sm font-medium text-sage-800">{countLabel}</p>

        {loading ? (
          <div className="border-b border-gray-200 bg-white py-16 text-center text-gray-500">
            {t.loading}
          </div>
        ) : empty ? (
          <div className="border-b border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mb-4 text-3xl">📋</div>
            <p className="text-gray-700">{t.empty}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 text-sm font-medium text-tea-700 hover:underline"
            >
              [{t.resetFilters}]
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {records.map((record, idx) => {
              const nick = record.userHandle?.trim() || t.anonymous;
              const lines = schoolDisplayLines(record, locale);
              const primaryType =
                record.admissionSchools.find((s) => s.isRegist)?.admissionType ||
                record.admissionSchools.find((s) => s.isAccept)
                  ?.admissionType ||
                record.admissionSchools[0]?.admissionType ||
                "";

              return (
                <article
                  key={record.id}
                  className={`px-4 py-4 transition-colors hover:bg-gray-50/80 ${
                    idx < records.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  {record.isFeatured ? (
                    <p className="mb-2 text-xs font-semibold text-amber-800">
                      {t.featured}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="shrink-0 lg:w-28">
                      <p className="text-lg font-bold text-gray-900">
                        {record.year}
                      </p>
                      {primaryType ? (
                        <p className="mt-0.5 text-xs text-gray-600">
                          {primaryType}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-gray-400">{nick}</p>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      {lines.length > 0 ? (
                        lines.map((line, i) => (
                          <div
                            key={i}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusBadgeClasses(line.badgeLabel)}`}
                            >
                              {line.badgeLabel}
                            </span>
                            <span className="font-medium text-gray-900">
                              {line.univ}
                            </span>
                            {line.dept ? (
                              <span className="text-sm text-gray-500">
                                {line.dept}
                              </span>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">—</p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2 lg:w-44">
                      <div className="flex items-center gap-3">
                        <AdmissionLikeButton
                          admissionId={record.id}
                          initialCount={record.likesCount ?? 0}
                          locale={locale}
                        />
                        <span className="text-sm text-gray-500">
                          💬 {record.dcCommentCount ?? 0}
                        </span>
                      </div>
                      <Link
                        href={`${basePath}/${record.id}`}
                        className="text-sm font-medium text-tea-700 hover:text-tea-900 hover:underline"
                      >
                        {t.more}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !empty && totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-tea-400 disabled:opacity-40"
            >
              {t.prev}
            </button>
            <PageNumbers
              current={page}
              totalPages={totalPages}
              onSelect={setPage}
            />
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-tea-400 disabled:opacity-40"
            >
              {t.next}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
