"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FORUM_TABS,
  FORUM_UNIVERSITY_OPTIONS,
  SOURCE_BADGE_CLASS,
  SOURCE_LABELS,
  SUBCATEGORY_LABELS,
} from "@/lib/forum/constants";
import { UNIVERSITY_LABELS } from "@/lib/study-korea/constants";

export interface ForumPost {
  id: string;
  source: string;
  title: string;
  url: string;
  university: string;
  subcategory: string;
  category: string;
  upvotes: number;
  source_created_at: string | null;
  created_at: string;
}

type Props = {
  locale?: "ko" | "en";
  fixedUniversity?: string;
  showUniversityFilter?: boolean;
  universityInfo?: {
    name_kr: string;
    name_en: string;
    country?: string;
    logo?: string;
  } | null;
  admissionsHref?: string;
};

const PAGE_SIZE = 20;

export default function StudyForumBoard({
  locale = "ko",
  fixedUniversity,
  showUniversityFilter = true,
  universityInfo,
  admissionsHref,
}: Props) {
  const [tab, setTab] = useState("all");
  const [university, setUniversity] = useState(fixedUniversity ?? "");
  const [page, setPage] = useState(0);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      sort: "latest",
      stats: "1",
    });
    if (tab !== "all") params.set("category", tab);
    const univ = fixedUniversity ?? university;
    if (univ) params.set("university", univ);

    const res = await fetch(`/api/forum?${params}`);
    const json = await res.json();
    if (res.ok) {
      setPosts(json.posts ?? []);
      setTotal(json.total ?? 0);
      if (json.statsBySource) setStats(json.statsBySource);
    }
    setLoading(false);
  }, [tab, university, fixedUniversity, page]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(0);
  }, [tab, university, fixedUniversity]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const naverN = stats.naver_blog ?? 0;
  const redditN = stats.reddit ?? 0;
  const quoraN = stats.quora ?? 0;

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US");
  };

  const univLabel = (slug: string) => {
    if (!slug) return null;
    const u = UNIVERSITY_LABELS[slug];
    return u ? (locale === "ko" ? u.kr : u.en) : slug;
  };

  return (
    <div className="min-h-screen bg-sage-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-6">
          {universityInfo && (
            <div className="bg-white rounded-xl border border-sage-200 p-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {locale === "ko"
                  ? universityInfo.name_kr
                  : universityInfo.name_en || universityInfo.name_kr}
              </h1>
              {universityInfo.name_en && locale === "ko" && (
                <p className="text-gray-600 text-sm">{universityInfo.name_en}</p>
              )}
              {admissionsHref && (
                <Link
                  href={admissionsHref}
                  className="inline-block mt-3 text-sm font-medium text-tea-600 hover:underline"
                >
                  {locale === "ko" ? "→ 합격DB 보기" : "→ Admissions DB"}
                </Link>
              )}
            </div>
          )}
          {!universityInfo && (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {locale === "ko" ? "유학 포럼" : "Study Forum"}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {locale === "ko"
                  ? "네이버 · Reddit · Quora · 공식 입시/장학 정보"
                  : "Naver, Reddit, Quora & official study-in-Korea sources"}
              </p>
            </>
          )}
        </header>

        <div className="flex flex-wrap gap-2 mb-4">
          {FORUM_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                tab === t.id
                  ? "bg-tea-600 text-white"
                  : "bg-white text-gray-800 border border-sage-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showUniversityFilter && !fixedUniversity && (
          <>
            <select
              className="mb-2 w-full sm:w-56 rounded-lg border border-sage-200 px-3 py-2 text-sm bg-white text-gray-900"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            >
              {FORUM_UNIVERSITY_OPTIONS.map((o) => (
                <option key={o.slug || "all"} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2 mb-4">
              {FORUM_UNIVERSITY_OPTIONS.filter((o) => o.slug).map((o) => (
                <Link
                  key={o.slug}
                  href={`/forum/${o.slug}`}
                  className="text-xs px-2 py-1 rounded-full bg-white border border-sage-200 text-gray-800 hover:border-tea-500"
                >
                  {o.label}
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="text-xs text-gray-600 mb-4 bg-white border border-sage-200 rounded-lg px-3 py-2">
          {locale === "ko" ? "총" : "Total"}{" "}
          <strong className="text-gray-900">{total}</strong>
          {locale === "ko" ? "개 게시글" : " posts"} |{" "}
          {locale === "ko" ? "네이버" : "Naver"} {naverN} | Reddit {redditN} | Quora{" "}
          {quoraN}
        </div>

        {loading && (
          <p className="text-gray-600 text-center py-12">
            {locale === "ko" ? "불러오는 중…" : "Loading…"}
          </p>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-gray-600 text-center py-12">
            {locale === "ko" ? "게시글이 없습니다." : "No posts yet."}
          </p>
        )}

        <ul className="space-y-2">
          {posts.map((p) => {
            const sub = p.subcategory || p.category || "general";
            const srcClass =
              SOURCE_BADGE_CLASS[p.source] ?? "bg-gray-100 text-gray-800";
            const srcLabel = SOURCE_LABELS[p.source] ?? p.source;
            const uni = univLabel(p.university);

            return (
              <li
                key={p.id}
                className="bg-white border border-sage-200 rounded-lg px-4 py-3 hover:border-tea-400 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${srcClass}`}
                  >
                    [{srcLabel}]
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-tea-50 text-tea-800">
                    {SUBCATEGORY_LABELS[sub] ?? sub}
                  </span>
                  {uni && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sage-100 text-gray-800">
                      {uni}
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-900 hover:text-tea-600 text-sm leading-snug flex-1"
                  >
                    {p.title}
                  </a>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tea-600 shrink-0 text-lg"
                    title="원문"
                    aria-label="원문 링크"
                  >
                    ↗
                  </a>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span>{formatDate(p.source_created_at ?? p.created_at)}</span>
                  {p.upvotes > 0 && <span>👍 {p.upvotes}</span>}
                </div>
              </li>
            );
          })}
        </ul>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-4 py-2 text-sm rounded border bg-white text-gray-900 disabled:opacity-40"
            >
              {locale === "ko" ? "이전" : "Prev"}
            </button>
            <span className="px-3 py-2 text-sm text-gray-600">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm rounded border bg-white text-gray-900 disabled:opacity-40"
            >
              {locale === "ko" ? "다음" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
