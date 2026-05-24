"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdmissionRecord } from "@/lib/types";
import { schoolDisplayLines, type SchoolDisplayLine } from "@/lib/supabase/map";
import { formatText } from "@/lib/utils/format-text";
import StatusBadge from "@/components/ui/StatusBadge";
import { AdmissionsListSkeleton } from "@/components/ui/Skeleton";
import AdmissionLikeButton from "@/components/admissions/AdmissionLikeButton";
import PopularAdmissionsSection, {
  AdmissionsListDivider,
} from "@/components/admissions/PopularAdmissionsSection";
import AdmitTrackBadge from "@/components/admissions/AdmitTrackBadge";
import FeaturedIntlStories from "@/components/admissions/FeaturedIntlStories";
import {
  ADMIT_TRACK_FILTER_OPTIONS,
  EN_DEFAULT_ADMIT_TRACKS,
  parseAdmitTrackList,
  type AdmitTrack,
} from "@/lib/admissions/admit-track";
import type { Dictionary, Locale } from "@/lib/i18n/dictionary";
import { withLang } from "@/lib/i18n/locale";

const PAGE_SIZE = 20;

const TEXT = {
  ko: {
    title: "합격 후기 DB",
    subtitle: (n: number) =>
      `총 ${n.toLocaleString()}개의 합격 스펙과 후기가 있습니다`,
    register: "+ 후기 등록하기",
    searchPlaceholder: "학교 검색...",
    yearAll: "연도",
    typeAll: "전형",
    statusAll: "상태",
    sortLabel: "정렬",
    sortLatest: "최신순",
    sortLikes: "인기순",
    sortViews: "조회순",
    sortOldest: "오래된순",
    empty: "조건에 맞는 합격 후기가 없습니다.",
    emptyIntl:
      "외국인 학생 합격 데이터를 모으고 있어요. 첫 번째로 등록해주세요.",
    emptyIntlCta: "후기 등록하기 →",
    trackFilter: "전형",
    resetFilters: "필터 초기화",
    schoolFilter: "학교 필터",
    more: "더보기 →",
    prev: "이전",
    next: "다음",
    anonymous: "익명",
    pillScore: "수능점수 있음",
    pillGpa: "내신 있음",
    pillReview: "후기 있음",
  },
  en: {
    title: "Admissions DB",
    subtitle: (n: number) =>
      `${n.toLocaleString()} admission stories and specs`,
    register: "Share your story →",
    searchPlaceholder: "Search school...",
    yearAll: "Year",
    typeAll: "Type",
    statusAll: "Status",
    sortLabel: "Sort",
    sortLatest: "Latest",
    sortLikes: "Most likes",
    sortViews: "Most views",
    sortOldest: "Oldest",
    empty: "No stories match your filters.",
    emptyIntlTitle: "Be the first international student to share.",
    emptyIntlSub:
      "Your story helps the next generation choose Korean universities.",
    emptyIntlCta: "Share Your Story →",
    emptyIntlWhy: "Why share?",
    trackFilter: "Track",
    resetFilters: "Clear filters",
    schoolFilter: "School",
    more: "View more →",
    prev: "Prev",
    next: "Next",
    anonymous: "Anonymous",
    pillScore: "Test scores",
    pillGpa: "GPA",
    pillReview: "Review",
  },
} as const;

const YEAR_OPTIONS = ["", "2024", "2023", "2022", "2021", "2020", "before2019"];
const TYPE_OPTIONS: { value: string; ko: string; en: string }[] = [
  { value: "", ko: "전체", en: "All" },
  { value: "수시", ko: "수시", en: "Early" },
  { value: "정시", ko: "정시", en: "Regular" },
  { value: "편입", ko: "편입", en: "Transfer" },
  { value: "논술", ko: "논술", en: "Essay" },
  { value: "기타", ko: "기타", en: "Other" },
];

const selectClass =
  "rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white " +
  "focus:outline-none focus:ring-2 focus:ring-orange-500";

const inputClass =
  "w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 pl-9 text-sm text-white " +
  "placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500";

function specPills(record: AdmissionRecord, locale: "ko" | "en"): string[] {
  const t = TEXT[locale];
  const pills: string[] = [];
  if (record.inputScore?.trim() && formatText(record.inputScore) !== "-") {
    pills.push(t.pillScore);
  }
  if (record.inputGpa?.trim() && formatText(record.inputGpa) !== "-") {
    pills.push(t.pillGpa);
  }
  if (record.admissionSchools.some((s) => s.review?.trim())) {
    pills.push(t.pillReview);
  }
  return pills;
}

function lineStatus(line: SchoolDisplayLine): "enroll" | "accept" | "reject" {
  if (line.badge === "등록") return "enroll";
  if (line.badge === "합격") return "accept";
  return "reject";
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
          <span key={`e-${i}`} className="px-2 text-[#9CA3AF]">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            className={`min-w-[2.25rem] rounded-md px-2 py-1 text-sm transition-colors ${
              p === current
                ? "bg-orange-500 font-semibold text-white"
                : "border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
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
  dict,
}: {
  locale?: Locale;
  dict?: Dictionary;
}) {
  const t = {
    ...TEXT[locale],
    ...(dict && { title: dict.admissions_title }),
  };
  const basePath = "/admissions";
  const detailHref = (id: string) => withLang(`/admissions/${id}`, locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const listSectionRef = useRef<HTMLDivElement>(null);

  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [popular, setPopular] = useState<AdmissionRecord[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [draftSearch, setDraftSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedYear, setAppliedYear] = useState("");
  const [appliedType, setAppliedType] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  type SortMode = "latest" | "likes" | "views" | "oldest";

  const parseSortParam = (s: string | null): SortMode => {
    if (s === "likes" || s === "popular") return "likes";
    if (s === "views") return "views";
    if (s === "oldest") return "oldest";
    return "latest";
  };

  const [appliedSort, setAppliedSort] = useState<SortMode>(() =>
    parseSortParam(searchParams.get("sort"))
  );

  const resolveInitialTracks = (
    sp: URLSearchParams,
    loc: Locale
  ): AdmitTrack[] | null => {
    const raw = sp.get("admit_track");
    if (raw === "all") return null;
    if (raw) {
      const parsed = parseAdmitTrackList(raw);
      return parsed.length > 0 ? parsed : null;
    }
    if (loc === "en") return [...EN_DEFAULT_ADMIT_TRACKS];
    return null;
  };

  const [appliedTracks, setAppliedTracks] = useState<AdmitTrack[] | null>(() =>
    resolveInitialTracks(searchParams, locale)
  );
  const [appliedUnivId, setAppliedUnivId] = useState<number | null>(() => {
    const raw = searchParams.get("univ_id");
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  });
  const [univFilterLabel, setUnivFilterLabel] = useState("");

  useEffect(() => {
    setAppliedSort(parseSortParam(searchParams.get("sort")));
    setAppliedTracks(resolveInitialTracks(searchParams, locale));
  }, [searchParams, locale]);

  useEffect(() => {
    const raw = searchParams.get("univ_id");
    if (!raw) {
      setAppliedUnivId(null);
      setUnivFilterLabel("");
      return;
    }
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    setAppliedUnivId(n);
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/universities?id=${n}`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const u = json.university as { name_kr?: string; name_en?: string } | null;
        if (!u || cancelled) return;
        const label =
          locale === "en" && u.name_en?.trim()
            ? u.name_en.trim()
            : (u.name_kr?.trim() || u.name_en?.trim() || `#${n}`);
        setUnivFilterLabel(label);
      } catch {
        if (!cancelled) setUnivFilterLabel(`#${n}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, locale]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;

  const tracksEqual = (a: AdmitTrack[] | null, b: AdmitTrack[] | null) => {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    if (a.length !== b.length) return false;
    const sa = [...a].sort().join(",");
    const sb = [...b].sort().join(",");
    return sa === sb;
  };

  const enDefaultActive =
    locale === "en" &&
    appliedTracks !== null &&
    tracksEqual(appliedTracks, EN_DEFAULT_ADMIT_TRACKS) &&
    !searchParams.has("admit_track");

  const hasActiveFilters =
    Boolean(appliedSearch) ||
    Boolean(appliedYear) ||
    Boolean(appliedType) ||
    Boolean(appliedStatus) ||
    appliedUnivId !== null ||
    appliedSort !== "latest" ||
    (appliedTracks !== null &&
      !tracksEqual(appliedTracks, EN_DEFAULT_ADMIT_TRACKS) &&
      !enDefaultActive) ||
    (appliedTracks === null && searchParams.get("admit_track") === "all");

  const syncAdmitTrackInUrl = useCallback(
    (tracks: AdmitTrack[] | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tracks === null) {
        params.set("admit_track", "all");
      } else {
        params.set("admit_track", tracks.join(","));
      }
      const q = params.toString();
      router.replace(q ? `${basePath}?${q}` : withLang(basePath, locale), {
        scroll: false,
      });
    },
    [router, searchParams, basePath, locale]
  );

  const syncUnivIdInUrl = useCallback(
    (id: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id !== null) params.set("univ_id", String(id));
      else params.delete("univ_id");
      const q = params.toString();
      router.replace(q ? `${basePath}?${q}` : withLang(basePath, locale), {
        scroll: false,
      });
    },
    [router, searchParams, basePath, locale]
  );

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
      if (appliedUnivId !== null) params.set("univ_id", String(appliedUnivId));
      if (appliedTracks && appliedTracks.length > 0) {
        params.set("admit_track", appliedTracks.join(","));
      }

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
  }, [
    offset,
    appliedSearch,
    appliedYear,
    appliedType,
    appliedStatus,
    appliedSort,
    appliedUnivId,
    appliedTracks,
  ]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    let cancelled = false;
    async function loadPopular() {
      setPopularLoading(true);
      try {
        const res = await fetch(
          "/api/admissions?limit=3&offset=0&sort=likes",
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (!cancelled) setPopular([]);
          return;
        }
        const json = await res.json();
        if (!cancelled) setPopular(json.data ?? []);
      } catch {
        if (!cancelled) setPopular([]);
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    }
    void loadPopular();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToList = () => {
    listSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const viewAllPopular = () => {
    setAppliedSort("likes");
    setPage(1);
    scrollToList();
  };

  const applySearch = () => {
    setAppliedSearch(draftSearch.trim());
    setPage(1);
  };

  const setYear = (v: string) => {
    setAppliedYear(v);
    setPage(1);
  };
  const setType = (v: string) => {
    setAppliedType(v);
    setPage(1);
  };
  const setStatus = (v: string) => {
    setAppliedStatus(v);
    setPage(1);
  };
  const setSort = (v: SortMode) => {
    setAppliedSort(v);
    setPage(1);
  };

  const resetFilters = () => {
    setDraftSearch("");
    setAppliedSearch("");
    setAppliedYear("");
    setAppliedType("");
    setAppliedStatus("");
    setAppliedSort("latest");
    setAppliedUnivId(null);
    setUnivFilterLabel("");
    syncUnivIdInUrl(null);
    setAppliedTracks(locale === "en" ? [...EN_DEFAULT_ADMIT_TRACKS] : null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("admit_track");
    const q = params.toString();
    router.replace(q ? `${basePath}?${q}` : withLang(basePath, locale), {
      scroll: false,
    });
    setPage(1);
  };

  const setTrackFilter = (value: AdmitTrack | "all") => {
    const next: AdmitTrack[] | null = value === "all" ? null : [value];
    setAppliedTracks(next);
    syncAdmitTrackInUrl(next);
    setPage(1);
  };

  const isTrackChipActive = (value: AdmitTrack | "all") => {
    if (value === "all") return appliedTracks === null;
    return (
      appliedTracks !== null &&
      appliedTracks.length === 1 &&
      appliedTracks[0] === value
    );
  };

  const clearUnivFilter = () => {
    setAppliedUnivId(null);
    setUnivFilterLabel("");
    syncUnivIdInUrl(null);
    setPage(1);
  };

  const filterPills = useMemo(() => {
    const pills: { key: string; label: string; clear: () => void }[] = [];
    if (appliedSearch)
      pills.push({
        key: "search",
        label: appliedSearch,
        clear: () => {
          setDraftSearch("");
          setAppliedSearch("");
          setPage(1);
        },
      });
    if (appliedYear)
      pills.push({
        key: "year",
        label: appliedYear === "before2019" ? "2019이전" : appliedYear,
        clear: () => setYear(""),
      });
    if (appliedType) {
      const opt = TYPE_OPTIONS.find((o) => o.value === appliedType);
      pills.push({
        key: "type",
        label: locale === "en" ? opt?.en ?? appliedType : opt?.ko ?? appliedType,
        clear: () => setType(""),
      });
    }
    if (appliedStatus) {
      const labels: Record<string, string> =
        locale === "en"
          ? { accept: "Accept", regist: "Enrolled", reject: "Rejected" }
          : { accept: "합격", regist: "등록", reject: "불합격" };
      pills.push({
        key: "status",
        label: labels[appliedStatus] ?? appliedStatus,
        clear: () => setStatus(""),
      });
    }
    if (appliedSort !== "latest") {
      const sortLabels: Record<SortMode, string> = {
        likes: t.sortLikes,
        views: t.sortViews,
        oldest: t.sortOldest,
        latest: t.sortLatest,
      };
      pills.push({
        key: "sort",
        label: sortLabels[appliedSort],
        clear: () => setSort("latest"),
      });
    }
    if (appliedUnivId !== null) {
      pills.push({
        key: "univ",
        label: univFilterLabel || `${t.schoolFilter} #${appliedUnivId}`,
        clear: clearUnivFilter,
      });
    }
    if (
      appliedTracks !== null &&
      !tracksEqual(appliedTracks, EN_DEFAULT_ADMIT_TRACKS)
    ) {
      const opt = ADMIT_TRACK_FILTER_OPTIONS.find(
        (o) => o.value !== "all" && appliedTracks.length === 1 && o.value === appliedTracks[0]
      );
      const multi =
        appliedTracks.length > 1
          ? appliedTracks
              .map((tr) =>
                locale === "en"
                  ? ADMIT_TRACK_FILTER_OPTIONS.find((o) => o.value === tr)?.en
                  : ADMIT_TRACK_FILTER_OPTIONS.find((o) => o.value === tr)?.ko
              )
              .filter(Boolean)
              .join(", ")
          : null;
      pills.push({
        key: "track",
        label:
          multi ||
          (locale === "en" ? opt?.en : opt?.ko) ||
          appliedTracks.join(", "),
        clear: () => {
          setAppliedTracks(locale === "en" ? [...EN_DEFAULT_ADMIT_TRACKS] : null);
          const params = new URLSearchParams(searchParams.toString());
          params.delete("admit_track");
          const q = params.toString();
          router.replace(q ? `${basePath}?${q}` : withLang(basePath, locale), {
            scroll: false,
          });
          setPage(1);
        },
      });
    }
    return pills;
  }, [
    appliedSearch,
    appliedYear,
    appliedType,
    appliedStatus,
    appliedSort,
    appliedUnivId,
    univFilterLabel,
    appliedTracks,
    locale,
    t,
    searchParams,
    router,
    basePath,
  ]);

  const empty = !loading && records.length === 0;

  const isIntlGksOnlyFilter =
    appliedTracks !== null &&
    appliedTracks.length > 0 &&
    appliedTracks.every(
      (t) => t === "international" || t === "gks"
    ) &&
    !appliedTracks.includes("overseas_kr");

  const showIntlEmpty = empty && locale === "en" && isIntlGksOnlyFilter;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-300">
      <div className="border-b border-gray-800 bg-gray-900/80">
        <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                {t.title}
              </h1>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                {t.subtitle(total)}
              </p>
            </div>
            <Link
              href={withLang("/admissions/new", locale)}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              {t.register}
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pt-6">
        {locale === "en" && (
          <FeaturedIntlStories locale={locale} hrefForId={detailHref} />
        )}
        <PopularAdmissionsSection
          records={popular}
          loading={popularLoading}
          locale={locale}
          basePath={basePath}
          hrefForId={detailHref}
          onViewAll={viewAllPopular}
        />
      </div>

      <div className="sticky top-14 z-20 border-b border-gray-800 bg-gray-950/95 backdrop-blur shadow-sm">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="w-full text-[11px] font-medium text-gray-500 sm:w-auto sm:mr-1 sm:self-center">
              {t.trackFilter}
            </span>
            {ADMIT_TRACK_FILTER_OPTIONS.map((opt) => {
              const active = isTrackChipActive(opt.value);
              const label = locale === "en" ? opt.en : opt.ko;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTrackFilter(opt.value)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    active
                      ? "border-orange-500 bg-orange-500/20 text-orange-200"
                      : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                placeholder={t.searchPlaceholder}
                className={inputClass}
              />
            </div>
            <select
              className={selectClass}
              value={appliedYear}
              onChange={(e) => setYear(e.target.value)}
              aria-label={t.yearAll}
            >
              <option value="">{t.yearAll}</option>
              {YEAR_OPTIONS.filter((y) => y && y !== "before2019").map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
              <option value="before2019">2019이전</option>
            </select>
            <select
              className={selectClass}
              value={appliedType}
              onChange={(e) => setType(e.target.value)}
              aria-label={t.typeAll}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {locale === "en" ? opt.en : opt.ko}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={appliedStatus}
              onChange={(e) => setStatus(e.target.value)}
              aria-label={t.statusAll}
            >
              <option value="">{t.statusAll}</option>
              <option value="accept">{locale === "en" ? "Accept" : "합격"}</option>
              <option value="regist">{locale === "en" ? "Enrolled" : "등록"}</option>
              <option value="reject">{locale === "en" ? "Rejected" : "불합격"}</option>
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="shrink-0">{t.sortLabel}:</span>
              <select
                className={selectClass}
                value={appliedSort}
                onChange={(e) => setSort(e.target.value as SortMode)}
              >
                <option value="latest">{t.sortLatest}</option>
                <option value="likes">{t.sortLikes}</option>
                <option value="oldest">{t.sortOldest}</option>
                <option value="views">{t.sortViews}</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {filterPills.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={p.clear}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 border border-orange-500/30 px-2.5 py-1 text-xs font-medium text-orange-300 hover:bg-orange-500/30"
                >
                  {p.label}
                  <span aria-hidden>×</span>
                </button>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-gray-400 hover:text-orange-400 underline-offset-2 hover:underline"
              >
                {t.resetFilters}
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={listSectionRef} className="container mx-auto max-w-4xl px-4 py-6 scroll-mt-24">
        <AdmissionsListDivider total={total} locale={locale} />

        {loading ? (
          <AdmissionsListSkeleton count={5} />
        ) : empty ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-16 text-center">
            {showIntlEmpty ? (
              <>
                <p className="text-4xl" aria-hidden>
                  🌏
                </p>
                <p className="mt-4 text-lg font-semibold text-white">
                  {TEXT.en.emptyIntlTitle}
                </p>
                <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
                  {TEXT.en.emptyIntlSub}
                </p>
                <Link
                  href={withLang("/admissions/new?lang=en", locale)}
                  className="mt-8 inline-block rounded-lg bg-orange-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  {TEXT.en.emptyIntlCta}
                </Link>
                <p className="mt-4">
                  <Link
                    href={withLang("/about-stories", locale)}
                    className="text-sm font-medium text-gray-400 hover:text-orange-400 underline-offset-2 hover:underline"
                  >
                    {TEXT.en.emptyIntlWhy}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-400">{t.empty}</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 text-sm font-medium text-orange-400 hover:underline"
                >
                  {t.resetFilters}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            {records.map((record, idx) => {
              const nick = record.userHandle?.trim() || t.anonymous;
              const lines = schoolDisplayLines(record, locale);
              const primaryType =
                record.admissionSchools.find((s) => s.isRegist)?.admissionType ||
                record.admissionSchools.find((s) => s.isAccept)?.admissionType ||
                record.admissionSchools[0]?.admissionType ||
                "";
              const pills = specPills(record, locale);

              return (
                <article
                  key={record.id}
                  className={`group px-4 sm:px-5 py-5 transition-colors hover:bg-gray-800/50 ${
                    record.isFeatured ? "border-l-2 border-l-orange-500" : ""
                  } ${idx < records.length - 1 ? "border-b border-gray-800" : ""}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex sm:flex-col gap-4 sm:gap-0 sm:w-24 shrink-0">
                      <div>
                        <p className="text-2xl font-bold tracking-tight text-white tabular-nums">
                          {record.year}
                        </p>
                        {primaryType ? (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {primaryType}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 sm:mt-2">{nick}</p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <AdmitTrackBadge
                          track={record.admitTrack}
                          locale={locale}
                        />
                        {record.isVerified && (
                          <span className="text-[10px] font-semibold text-emerald-400 border border-emerald-600/50 rounded-full px-2 py-0.5">
                            {locale === "en" ? "Verified" : "인증"}
                          </span>
                        )}
                        <h2 className="text-sm font-medium text-white line-clamp-2 sm:text-base">
                          {record.title}
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3 sm:hidden mb-2">
                        <AdmissionLikeButton
                          admissionId={record.id}
                          initialCount={record.likesCount ?? 0}
                        />
                        <span className="text-sm text-gray-400 tabular-nums">
                          💬 {record.dcCommentCount ?? 0}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {lines.length > 0 ? (
                          lines.map((line, i) => (
                            <div
                              key={i}
                              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
                            >
                              <StatusBadge
                                status={lineStatus(line)}
                                label={line.badgeLabel}
                              />
                              <span
                                className={
                                  line.badge === "등록"
                                    ? "font-semibold text-white"
                                    : line.badge === "합격"
                                      ? "font-medium text-gray-200"
                                      : "text-gray-500 line-through"
                                }
                              >
                                {line.univ}
                              </span>
                              {line.dept ? (
                                <span
                                  className={
                                    line.badge === "등록"
                                      ? "text-sm text-gray-400"
                                      : line.badge === "합격"
                                        ? "text-sm text-gray-400"
                                        : "text-sm text-gray-500 line-through"
                                  }
                                >
                                  {line.dept}
                                </span>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">—</p>
                        )}
                      </div>

                      {pills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {pills.map((pill) => (
                            <span
                              key={pill}
                              className="rounded-full bg-gray-800 px-2 py-0.5 text-[11px] text-gray-400"
                            >
                              {pill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 w-20">
                      <div className="flex items-center gap-3 text-sm">
                        <AdmissionLikeButton
                          admissionId={record.id}
                          initialCount={record.likesCount ?? 0}
                        />
                        <span className="text-gray-400 tabular-nums">
                          💬 {record.dcCommentCount ?? 0}
                        </span>
                      </div>
                      <Link
                        href={detailHref(record.id)}
                        className="text-sm font-medium text-orange-400 hover:underline opacity-80 group-hover:opacity-100"
                      >
                        {t.more}
                      </Link>
                    </div>
                  </div>

                  <div className="mt-2 sm:hidden">
                    <Link
                      href={detailHref(record.id)}
                      className="text-sm font-medium text-orange-400 hover:text-orange-300 hover:underline"
                    >
                      {t.more}
                    </Link>
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
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
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
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
            >
              {t.next}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
