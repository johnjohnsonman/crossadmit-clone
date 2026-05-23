"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import UniversityAutocomplete, {
  type UniversityPick,
} from "@/components/crossadmit/UniversityAutocomplete";
import SourceBadge from "@/components/ui/SourceBadge";
import { ForumListSkeleton } from "@/components/ui/Skeleton";
import ForumPopularSidebar from "@/components/forum/ForumPopularSidebar";
import { forumTabsForLocale, subcategoryLabel } from "@/lib/forum/constants";
import {
  postDisplaySummary,
  postDisplayTitle,
  resolveStudyKoreaLang,
  type StudyKoreaLang,
} from "@/lib/study-korea/display";

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
  ai_summary?: string;
  ai_summary_kr?: string;
  ai_title_en?: string;
  ai_summary_en?: string;
  university_name_kr?: string;
  university_name_en?: string;
  university_logo?: string;
  university_matched_id?: number | null;
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
  const searchParams = useSearchParams();
  const baseLang = resolveStudyKoreaLang(locale, searchParams.get("lang"));
  const [viewLang, setViewLang] = useState<StudyKoreaLang>(baseLang);
  const [tab, setTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [selectedUniv, setSelectedUniv] = useState<UniversityPick | null>(null);
  const [page, setPage] = useState(0);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [total, setTotal] = useState(0);
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

    if (fixedUniversity) {
      params.set("university", fixedUniversity);
    } else if (selectedUniv) {
      params.set("university_id", String(selectedUniv.id));
    }

    const res = await fetch(`/api/forum?${params}`);
    const json = await res.json();
    if (res.ok) {
      setPosts(json.posts ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [tab, selectedUniv, fixedUniversity, page]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setViewLang(baseLang);
  }, [baseLang]);

  useEffect(() => {
    setPage(0);
  }, [tab, selectedUniv, fixedUniversity]);

  const clearUniversity = () => {
    setSelectedUniv(null);
    setSearchInput("");
  };

  const selectPopularUniv = (u: UniversityPick) => {
    setSelectedUniv(u);
    setSearchInput(locale === "ko" ? u.name_kr : u.name_en || u.name_kr);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const forumTabs = forumTabsForLocale(locale);
  const forumBase = locale === "en" ? "/en/forum" : "/forum";

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return locale === "ko"
      ? `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`
      : d.toLocaleDateString("en-US");
  };

  const showMainHeader = !universityInfo;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {showMainHeader && (
        <div className="border-b border-[#E5E5E0] bg-white">
          <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1A1A]">
              {locale === "ko" ? "유학 포럼" : "Study Korea Forum"}
            </h1>
            <p className="mt-2 text-sm text-[#6B7280] leading-relaxed max-w-2xl">
              {locale === "ko"
                ? "외국인 유학생들의 한국 유학 경험과 정보를 공유합니다"
                : "Share Korean study abroad experiences and information"}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {universityInfo && (
          <div className="rounded-xl border border-[#E5E5E0] bg-white p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              {universityInfo.logo ? (
                <img
                  src={universityInfo.logo}
                  alt=""
                  className="h-12 w-12 object-contain"
                />
              ) : null}
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#1A1A1A]">
                  {locale === "ko"
                    ? universityInfo.name_kr
                    : universityInfo.name_en || universityInfo.name_kr}
                </h1>
                {universityInfo.name_en && locale === "ko" && (
                  <p className="text-sm text-[#6B7280]">
                    {universityInfo.name_en}
                  </p>
                )}
              </div>
            </div>
            {admissionsHref && (
              <Link
                href={admissionsHref}
                className="inline-block mt-3 text-sm font-medium text-[#2D5A27] hover:underline"
              >
                {locale === "ko" ? "→ 합격DB 보기" : "→ Admissions DB"}
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 min-w-0">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
              <div className="flex gap-1 min-w-max border-b border-[#E5E5E0]">
                {forumTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                      tab === t.id
                        ? "border-[#2D5A27] text-[#2D5A27] font-semibold"
                        : "border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {showUniversityFilter && !fixedUniversity && (
              <div className="mb-5">
                <div className="flex gap-2 items-stretch">
                  <span className="flex items-center pl-3 text-[#9CA3AF] bg-white border border-[#E5E5E0] border-r-0 rounded-l-lg">
                    🔍
                  </span>
                  <UniversityAutocomplete
                    value={searchInput}
                    univId={selectedUniv?.id ?? null}
                    onChange={setSearchInput}
                    onSelect={(u) => {
                      setSelectedUniv(u);
                      setSearchInput(
                        locale === "ko" ? u.name_kr : u.name_en || u.name_kr
                      );
                    }}
                    onClearId={() => setSelectedUniv(null)}
                    placeholder={
                      locale === "ko"
                        ? "대학명으로 필터..."
                        : "Filter by university..."
                    }
                    locale={locale}
                    className="flex-1 px-3 py-2.5 text-sm border border-[#E5E5E0] rounded-r-lg rounded-l-none bg-white text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#2D5A27]/25"
                  />
                  {selectedUniv && (
                    <button
                      type="button"
                      onClick={clearUniversity}
                      className="px-3 rounded-lg border border-[#E5E5E0] bg-white text-[#6B7280] hover:bg-[#FAFAF8] text-sm shrink-0"
                      aria-label={locale === "ko" ? "필터 초기화" : "Clear"}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <p className="text-xs text-[#6B7280]">
                {locale === "ko" ? "총" : ""}{" "}
                <span className="font-medium text-[#1A1A1A] tabular-nums">
                  {total}
                </span>
                {locale === "ko" ? "개 게시글" : " posts"}
              </p>
              <div className="flex rounded-lg border border-[#E5E5E0] overflow-hidden bg-white text-xs">
                <button
                  type="button"
                  className={`px-3 py-1.5 ${viewLang === "en" ? "bg-[#2D5A27] text-white font-medium" : "text-[#6B7280]"}`}
                  onClick={() => setViewLang("en")}
                >
                  US
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 ${viewLang === "ko" ? "bg-[#2D5A27] text-white font-medium" : "text-[#6B7280]"}`}
                  onClick={() => setViewLang("ko")}
                >
                  KR
                </button>
              </div>
            </div>

            {loading ? (
              <ForumListSkeleton count={5} />
            ) : posts.length === 0 ? (
              <div className="rounded-xl border border-[#E5E5E0] bg-white py-16 text-center text-sm text-[#6B7280]">
                {locale === "ko" ? "게시글이 없습니다." : "No posts found."}
              </div>
            ) : (
              <ul className="space-y-3">
                {posts.map((p) => {
                  const sub = p.subcategory || p.category || "general";
                  const displayTitle = postDisplayTitle(p, viewLang);
                  const summary = postDisplaySummary(p, viewLang);
                  const uni =
                    locale === "ko"
                      ? p.university_name_kr
                      : p.university_name_en || p.university_name_kr;

                  return (
                    <li
                      key={p.id}
                      className="rounded-xl border border-[#E5E5E0] bg-white p-4 sm:p-5 shadow-sm hover:border-[#2D5A27]/25 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <SourceBadge source={p.source} />
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F5F5F4] text-[#6B7280]">
                            {subcategoryLabel(sub, locale)}
                          </span>
                        </div>
                        <time className="text-xs text-[#9CA3AF] tabular-nums">
                          {formatDate(p.source_created_at ?? p.created_at)}
                        </time>
                      </div>

                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <h2 className="font-semibold text-[#1A1A1A] text-base leading-snug group-hover:text-[#2D5A27] transition-colors">
                          {displayTitle}
                        </h2>
                        {summary && (
                          <p className="mt-2 text-sm text-[#6B7280] leading-relaxed line-clamp-2">
                            <span className="text-[#9CA3AF]">
                              {viewLang === "en" ? "AI summary: " : "AI 요약: "}
                            </span>
                            {summary}
                          </p>
                        )}
                      </a>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {uni && (
                          <span className="text-[#6B7280]">
                            {p.university_matched_id ? (
                              <Link
                                href={`${forumBase}/${p.university || "other"}`}
                                className="hover:text-[#2D5A27] font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {uni}
                              </Link>
                            ) : (
                              uni
                            )}
                          </span>
                        )}
                        <div className="flex items-center gap-3 ml-auto">
                          <span className="text-[#6B7280] tabular-nums">
                            👍 {p.upvotes}
                          </span>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[#2D5A27] hover:underline"
                          >
                            {locale === "ko" ? "외부 링크 →" : "Open →"}
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {totalPages > 1 && !loading && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 text-sm rounded-lg border border-[#E5E5E0] bg-white text-[#1A1A1A] disabled:opacity-40 hover:bg-[#FAFAF8]"
                >
                  {locale === "ko" ? "이전" : "Prev"}
                </button>
                <span className="px-3 py-2 text-sm text-[#6B7280] tabular-nums">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 text-sm rounded-lg border border-[#E5E5E0] bg-white text-[#1A1A1A] disabled:opacity-40 hover:bg-[#FAFAF8]"
                >
                  {locale === "ko" ? "다음" : "Next"}
                </button>
              </div>
            )}
          </div>

          {showUniversityFilter && !fixedUniversity && (
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <ForumPopularSidebar
                  locale={locale}
                  onSelect={selectPopularUniv}
                  activeId={selectedUniv?.id ?? null}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
