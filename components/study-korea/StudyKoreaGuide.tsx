"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import UniversityAutocomplete, {
  type UniversityPick,
} from "@/components/crossadmit/UniversityAutocomplete";
import UniversityIntlCards from "@/components/study-korea/UniversityIntlCards";
import {
  CATEGORY_LABELS_EN,
  CATEGORY_LABELS_KR,
  UNIVERSITY_LABELS,
} from "@/lib/study-korea/constants";
import {
  postDisplaySummary,
  postDisplayTitle,
  resolveStudyKoreaLang,
  type StudyKoreaLang,
} from "@/lib/study-korea/display";

export interface StudyKoreaPost {
  id: string;
  source: string;
  title: string;
  url: string;
  author: string;
  category: string;
  university: string;
  language: string;
  upvotes: number;
  comment_count: number;
  ai_summary: string;
  ai_summary_kr: string;
  ai_title_en?: string;
  ai_summary_en?: string;
  ai_content_en?: string;
  ai_tags: string[];
  is_featured: boolean;
  source_created_at: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const TABS = [
  "all",
  "admission",
  "scholarship",
  "visa",
  "dormitory",
  "life",
  "language",
  "cost",
] as const;

type Props = { locale: "ko" | "en" };

const selectClass =
  "rounded-lg border border-gray-800 px-3 py-2 text-sm bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function StudyKoreaGuide({ locale }: Props) {
  const searchParams = useSearchParams();
  const urlLang = searchParams.get("lang");
  const baseLang = resolveStudyKoreaLang(locale, urlLang);
  const labels = baseLang === "ko" ? CATEGORY_LABELS_KR : CATEGORY_LABELS_EN;

  const [tab, setTab] = useState<string>("all");
  const [univSearch, setUnivSearch] = useState("");
  const [selectedUniv, setSelectedUniv] = useState<UniversityPick | null>(null);
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [viewLang, setViewLang] = useState<StudyKoreaLang>(baseLang);
  const [page, setPage] = useState(0);
  const [posts, setPosts] = useState<StudyKoreaPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setViewLang(baseLang);
  }, [baseLang]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      sort,
    });
    if (tab !== "all") params.set("category", tab);
    if (selectedUniv) params.set("university_id", String(selectedUniv.id));
    if (language) params.set("language", language);

    try {
      const res = await fetch(`/api/study-korea?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Load failed");
      setPosts(json.posts ?? []);
      setTotal(json.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedUniv, language, sort, page]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(0);
  }, [tab, selectedUniv, language, sort]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US");
    } catch {
      return "";
    }
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active
        ? "bg-orange-500 text-white"
        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
    }`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {locale === "ko" ? "한국 유학 가이드" : "Study in Korea Guide"}
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">
            {locale === "ko"
              ? "Reddit·YouTube에서 수집한 한국 유학 정보를 AI로 요약해 제공합니다."
              : "Curated study-in-Korea tips from Reddit and YouTube, summarized by AI."}
          </p>
        </header>

        <UniversityIntlCards locale={baseLang} />

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={tabClass(tab === t)}
            >
              {labels[t] ?? t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="sm:col-span-2 flex gap-2 items-stretch">
            <UniversityAutocomplete
              value={univSearch}
              univId={selectedUniv?.id ?? null}
              onChange={setUnivSearch}
              onSelect={(u) => {
                setSelectedUniv(u);
                setUnivSearch(locale === "ko" ? u.name_kr : u.name_en || u.name_kr);
              }}
              onClearId={() => setSelectedUniv(null)}
              placeholder={
                locale === "ko" ? "대학 검색 (전체)" : "Search university (all)"
              }
              locale={locale}
              variant="dark"
              className="flex-1"
            />
            {selectedUniv && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUniv(null);
                  setUnivSearch("");
                }}
                className="px-3 py-2 rounded-lg border border-gray-800 bg-gray-800 text-sm text-gray-300 hover:bg-gray-700 shrink-0"
              >
                {locale === "ko" ? "초기화" : "Clear"}
              </button>
            )}
          </div>
          <select
            className={selectClass}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">
              {locale === "ko" ? "언어 (전체)" : "Language (all)"}
            </option>
            <option value="en">English</option>
            <option value="ko">한국어</option>
          </select>
          <select
            className={selectClass}
            value={sort}
            onChange={(e) =>
              setSort(e.target.value === "popular" ? "popular" : "latest")
            }
          >
            <option value="latest">
              {locale === "ko" ? "최신순" : "Latest"}
            </option>
            <option value="popular">
              {locale === "ko" ? "인기순" : "Popular"}
            </option>
          </select>
          <div className="flex rounded-lg border border-gray-800 overflow-hidden bg-gray-900 text-sm">
            <button
              type="button"
              className={`flex-1 py-2 font-medium transition-colors ${
                viewLang === "en"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setViewLang("en")}
            >
              US
            </button>
            <button
              type="button"
              className={`flex-1 py-2 font-medium transition-colors ${
                viewLang === "ko"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setViewLang("ko")}
            >
              KR
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-gray-500 text-center py-12">
            {locale === "ko" ? "불러오는 중…" : "Loading…"}
          </p>
        )}
        {error && (
          <p className="text-red-400 text-center py-8 text-sm">{error}</p>
        )}
        {!loading && !error && posts.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            {locale === "ko"
              ? "게시물이 없습니다. Supabase 마이그레이션 후 파이프라인을 실행해 주세요."
              : "No posts yet. Run the pipeline after applying the Supabase migration."}
          </p>
        )}

        <ul className="space-y-4">
          {posts.map((p) => {
            const displayTitle = postDisplayTitle(p, viewLang);
            const summary = postDisplaySummary(p, viewLang);
            const catLabel = labels[p.category] ?? p.category;
            const uni =
              p.university && UNIVERSITY_LABELS[p.university]
                ? locale === "ko"
                  ? UNIVERSITY_LABELS[p.university].kr
                  : UNIVERSITY_LABELS[p.university].en
                : p.university;

            return (
              <li
                key={p.id}
                className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-5 hover:border-orange-500/40 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded border border-orange-500/30 bg-gray-800 text-orange-300">
                    {catLabel}
                  </span>
                  {p.is_featured && (
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      Featured
                    </span>
                  )}
                  {uni && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                      {uni}
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-white text-base md:text-lg leading-snug">
                  {displayTitle}
                </h2>
                {summary && (
                  <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                    {summary}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-medium"
                  >
                    {p.source === "youtube" ? (
                      <>
                        <span aria-hidden>▶</span> YouTube
                      </>
                    ) : (
                      <>
                        <span aria-hidden>↗</span> Reddit
                      </>
                    )}
                  </a>
                  <span>{formatDate(p.source_created_at ?? p.created_at)}</span>
                  <span>👍 {p.upvotes}</span>
                  {p.comment_count > 0 && (
                    <span>
                      💬 {p.comment_count}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-4 py-2 text-sm rounded-lg border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {locale === "ko" ? "이전" : "Prev"}
            </button>
            <span className="px-3 py-2 text-sm text-gray-400">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {locale === "ko" ? "다음" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
