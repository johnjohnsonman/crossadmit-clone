"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import UniversityAutocomplete from "@/components/crossadmit/UniversityAutocomplete";
import CrossadmitComparisonResult from "@/components/crossadmit/CrossadmitComparisonResult";
import type { CrossComparePayload } from "@/lib/crossadmit/comparison-data";
import { buildComparisonSlug } from "@/lib/crossadmit/comparison-utils";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import { withLang } from "@/lib/i18n/locale";

interface CrossAdmitRecord {
  id: string;
  university1: string;
  university2: string;
  totalAdmitted: number;
  choseUniversity1: number;
  choseUniversity2: number;
  percentage1: number;
  percentage2: number;
  confidenceInterval1: { min: number; max: number };
  confidenceInterval2: { min: number; max: number };
}

interface PopularComparison {
  id: string;
  university1: string;
  university2: string;
  percentage1: number;
  percentage2: number;
}

interface VideoPreview {
  id: string;
  title: string;
  thumbnail_url: string | null;
  source_url: string;
}

type SortOption = "latest" | "random" | "popular";

type ApiStat = {
  id: string;
  univ_name_win: string;
  univ_name_lose: string;
  count: number;
  percentage_win: number;
  percentage_lose: number;
};

function mapStatsToRecords(stats: ApiStat[]): CrossAdmitRecord[] {
  return stats.map((s) => ({
    id: s.id,
    university1: s.univ_name_win,
    university2: s.univ_name_lose,
    totalAdmitted: s.count,
    choseUniversity1: Math.round((s.count * s.percentage_win) / 100),
    choseUniversity2: Math.round((s.count * s.percentage_lose) / 100),
    percentage1: s.percentage_win,
    percentage2: s.percentage_lose,
    confidenceInterval1: {
      min: Math.max(0, s.percentage_win - 5),
      max: Math.min(100, s.percentage_win + 5),
    },
    confidenceInterval2: {
      min: Math.max(0, s.percentage_lose - 5),
      max: Math.min(100, s.percentage_lose + 5),
    },
  }));
}

function CrossAdmitPageInner() {
  const searchParams = useSearchParams();
  const locale: Locale = searchParams.get("lang") === "en" ? "en" : "ko";
  const t = getDictionary(locale);

  const [comparisons, setComparisons] = useState<CrossAdmitRecord[]>([]);
  const [popularComparisons, setPopularComparisons] = useState<PopularComparison[]>([]);
  const [latestVideos, setLatestVideos] = useState<VideoPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [univAName, setUnivAName] = useState("");
  const [univBName, setUnivBName] = useState("");
  const [univAId, setUnivAId] = useState<number | null>(null);
  const [univBId, setUnivBId] = useState<number | null>(null);
  const [vsCompareActive, setVsCompareActive] = useState(false);
  const [compareData, setCompareData] = useState<CrossComparePayload | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const itemsPerPage = 10;

  const fetchComparisons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ stats: "1", sort: sortOption });
      if (vsCompareActive && univAId !== null && univBId !== null) {
        params.set("univ_a", String(univAId));
        params.set("univ_b", String(univBId));
      }
      const response = await fetch(`/api/cross-comparisons?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      const stats = (data.stats ?? []) as ApiStat[];
      setComparisons(mapStatsToRecords(stats));
    } catch (error) {
      console.error("[CrossAdmit Page] Error fetching crossadmit data:", error);
      setComparisons([]);
    } finally {
      setLoading(false);
    }
  }, [sortOption, vsCompareActive, univAId, univBId]);

  useEffect(() => {
    void fetchComparisons();
  }, [fetchComparisons]);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const response = await fetch(
          "/api/cross-comparisons?stats=1&sort=popular",
          { cache: "no-store" }
        );
        const data = await response.json();
        const stats = (data.stats ?? []) as ApiStat[];
        const records = mapStatsToRecords(stats);
        setPopularComparisons(
          records.slice(0, 5).map((c) => ({
            id: c.id,
            university1: c.university1,
            university2: c.university2,
            percentage1: c.percentage1,
            percentage2: c.percentage2,
          }))
        );
      } catch (error) {
        console.error("[CrossAdmit Page] Error fetching popular:", error);
        setPopularComparisons([]);
      }
    };
    void fetchPopular();
  }, []);

  const vsCopy =
    locale === "en"
      ? {
          title: "Compare two schools",
          placeholderA: "School A",
          placeholderB: "School B",
          compare: "Compare",
          clearList: "All comparisons",
          toastSelect:
            "Please select schools from the suggestions dropdown",
          toastSame: "Please choose two different schools",
          resultHint: "Comparison result",
        }
      : {
          title: "두 대학 직접 비교",
          placeholderA: "A 대학",
          placeholderB: "B 대학",
          compare: "비교하기",
          clearList: "전체 목록",
          toastSelect: "자동완성에서 학교를 선택해주세요",
          toastSame: "서로 다른 두 학교를 선택해주세요",
          resultHint: "비교 결과",
        };

  const fetchComparePayload = useCallback(
    async (aId: number, bId: number) => {
      setCompareLoading(true);
      try {
        const qs = new URLSearchParams({
          compare: "1",
          univ_a: String(aId),
          univ_b: String(bId),
          locale,
        });
        const res = await fetch(`/api/cross-comparisons?${qs.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        setCompareData((json.data as CrossComparePayload) ?? null);
      } catch {
        setCompareData(null);
      } finally {
        setCompareLoading(false);
      }
    },
    [locale]
  );

  const handleVsCompare = () => {
    if (univAId === null || univBId === null) {
      setToast(vsCopy.toastSelect);
      return;
    }
    if (univAId === univBId) {
      setToast(vsCopy.toastSame);
      return;
    }
    setVsCompareActive(true);
    setCurrentPage(1);
    void fetchComparePayload(univAId, univBId);
  };

  const clearVsCompare = () => {
    setVsCompareActive(false);
    setCompareData(null);
    setUnivAName("");
    setUnivBName("");
    setUnivAId(null);
    setUnivBId(null);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const filteredComparisons = comparisons.filter((c) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      c.university1.toLowerCase().includes(query) ||
      c.university2.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredComparisons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComparisons = filteredComparisons.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, vsCompareActive]);

  useEffect(() => {
    const fetchLatestVideos = async () => {
      try {
        const response = await fetch("/api/videos?limit=4&offset=0");
        const data = await response.json();
        setLatestVideos((data.data || []) as VideoPreview[]);
      } catch (error) {
        console.error("[CrossAdmit Page] Error fetching latest videos:", error);
      }
    };

    void fetchLatestVideos();
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "크로스어드밋 | CrossAdmit | 交叉录取",
    alternateName: ["CrossAdmit", "交叉录取"],
    url: "https://crossadmit.com",
    description:
      "두 대학에 동시에 합격했을 때 학생들의 선택 통계 | Compare university admission statistics when students are accepted to multiple universities | 比较同时被多所大学录取时的学生选择统计",
    inLanguage: ["ko", "en", "zh-CN", "zh-TW", "es", "ja"],
    about: {
      "@type": "Thing",
      name: "Study in Korea | 留学韩国 | Estudiar en Corea",
      description:
        "Korean university admission statistics and information for international students",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://crossadmit.com/crossadmit?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const sortBtnClass = (active: boolean) =>
    `px-3 md:px-4 py-2 text-sm md:text-base font-medium rounded-md transition-colors whitespace-nowrap ${
      active
        ? "bg-orange-500 text-white"
        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
    }`;

  const emptyMessage =
    locale === "en"
      ? vsCompareActive
        ? "No comparison data yet."
        : searchQuery.trim()
          ? "No results."
          : "Preparing data…"
      : vsCompareActive
        ? "아직 비교 데이터가 없습니다."
        : searchQuery.trim()
          ? "검색 결과가 없습니다."
          : "데이터 준비 중입니다.";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-gray-950 text-gray-300">
        <div className="border-b border-gray-800 bg-gray-900/80">
          <div className="container mx-auto px-4 py-4 md:py-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">
              {t.crossadmit_title}
            </h1>
            <p className="text-sm md:text-lg text-gray-300 mb-1 md:mb-2">
              {t.crossadmit_subtitle}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
              {t.crossadmit_note}
            </p>
            <Link
              href={withLang("/crossadmit/register", locale)}
              className="inline-block px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md transition-colors"
            >
              {t.crossadmit_register}
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
            <div className="lg:col-span-3 space-y-4 md:space-y-6">
              {/* A vs B 직접 비교 */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm md:text-base font-bold text-white">
                    {vsCopy.title}
                  </h2>
                  {vsCompareActive && (
                    <button
                      type="button"
                      onClick={clearVsCompare}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-400"
                      aria-label={vsCopy.clearList}
                    >
                      <span className="text-lg leading-none">×</span>
                      <span>{vsCopy.clearList}</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                  <UniversityAutocomplete
                    value={univAName}
                    univId={univAId}
                    onChange={setUnivAName}
                    onSelect={(u) => {
                      setUnivAName(
                        locale === "en" && u.name_en.trim()
                          ? u.name_en
                          : u.name_kr
                      );
                      setUnivAId(u.id);
                    }}
                    onClearId={() => setUnivAId(null)}
                    placeholder={vsCopy.placeholderA}
                    locale={locale}
                    variant="dark"
                  />
                  <span className="text-center text-sm font-bold text-orange-400 shrink-0 py-1">
                    VS
                  </span>
                  <UniversityAutocomplete
                    value={univBName}
                    univId={univBId}
                    onChange={setUnivBName}
                    onSelect={(u) => {
                      setUnivBName(
                        locale === "en" && u.name_en.trim()
                          ? u.name_en
                          : u.name_kr
                      );
                      setUnivBId(u.id);
                    }}
                    onClearId={() => setUnivBId(null)}
                    placeholder={vsCopy.placeholderB}
                    locale={locale}
                    variant="dark"
                  />
                  <button
                    type="button"
                    onClick={handleVsCompare}
                    className="shrink-0 px-4 py-2 text-sm md:text-base font-semibold rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                  >
                    {vsCopy.compare}
                  </button>
                </div>
                {toast && (
                  <p
                    role="alert"
                    className="mt-3 text-xs md:text-sm text-amber-200 bg-amber-500/15 border border-amber-500/30 rounded-md px-3 py-2"
                  >
                    {toast}
                  </p>
                )}
                {vsCompareActive && univAName && univBName && (
                  <p className="mt-3 text-xs md:text-sm text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-md px-3 py-2">
                    <span className="font-semibold">{univAName}</span>
                    {" vs "}
                    <span className="font-semibold">{univBName}</span>
                    {" "}
                    {vsCopy.resultHint}
                    {univAId !== null && univBId !== null && (
                      <>
                        {" · "}
                        <Link
                          href={withLang(
                            `/crossadmit/${buildComparisonSlug(univAId, univBId)}`,
                            locale
                          )}
                          className="underline hover:text-orange-200"
                        >
                          {locale === "en" ? "Share link" : "공유 링크"}
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </div>

              {vsCompareActive && (
                <div className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF8] p-4 md:p-6">
                  <CrossadmitComparisonResult
                    data={compareData}
                    loading={compareLoading}
                    locale={locale}
                    onClear={clearVsCompare}
                  />
                </div>
              )}

              {/* 검색 및 정렬 */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 md:p-4">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="대학명 검색..."
                    disabled={vsCompareActive}
                    className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-gray-900 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder:text-gray-500 disabled:bg-gray-800 disabled:text-gray-600"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSortOption("latest")}
                      disabled={vsCompareActive}
                      className={sortBtnClass(sortOption === "latest")}
                    >
                      최신순
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOption("random")}
                      disabled={vsCompareActive}
                      className={sortBtnClass(sortOption === "random")}
                    >
                      랜덤순
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOption("popular")}
                      disabled={vsCompareActive}
                      className={sortBtnClass(sortOption === "popular")}
                    >
                      데이터많은 순
                    </button>
                  </div>
                </div>
              </div>

              {/* 비교 목록 */}
              {!vsCompareActive && (
              <div className="space-y-2 md:space-y-3">
                {loading ? (
                  <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center text-gray-500">
                    불러오는 중...
                  </div>
                ) : paginatedComparisons.length > 0 ? (
                  paginatedComparisons.map((comparison) => (
                    <Link
                      key={comparison.id}
                      href={withLang(`/crossadmit/${comparison.id}`, locale)}
                      className="block bg-gray-900 rounded-lg border border-gray-800 hover:border-orange-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between p-3 md:p-4">
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <div
                            className={`text-lg md:text-2xl font-bold whitespace-nowrap ${
                              comparison.percentage1 > comparison.percentage2
                                ? "text-green-400"
                                : "text-gray-500"
                            }`}
                          >
                            {comparison.percentage1}%
                          </div>
                          <div className="text-sm md:text-base font-semibold text-orange-400 truncate">
                            {comparison.university1}
                          </div>
                        </div>

                        <div className="px-2 md:px-4 text-xs md:text-sm text-gray-500 font-medium">
                          vs
                        </div>

                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 justify-end">
                          <div className="text-sm md:text-base font-semibold text-orange-400 truncate text-right">
                            {comparison.university2}
                          </div>
                          <div
                            className={`text-lg md:text-2xl font-bold whitespace-nowrap ${
                              comparison.percentage2 > comparison.percentage1
                                ? "text-red-400"
                                : "text-gray-500"
                            }`}
                          >
                            {comparison.percentage2}%
                          </div>
                        </div>

                        <div className="ml-3 md:ml-4 text-xs md:text-sm text-gray-500 whitespace-nowrap hidden md:block">
                          ({comparison.totalAdmitted}명)
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center text-gray-500">
                    {emptyMessage}
                  </div>
                )}
              </div>
              )}

              {!vsCompareActive && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors ${
                      currentPage === 1
                        ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                        : "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
                    }`}
                  >
                    이전
                  </button>

                  <div className="flex gap-1 md:gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors ${
                              currentPage === page
                                ? "bg-orange-500 text-white"
                                : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (page === currentPage - 3 || page === currentPage + 3) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                        : "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
                    }`}
                  >
                    다음
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 md:p-6">
                <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">
                  인기 비교
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {popularComparisons.length > 0 ? (
                    popularComparisons.map((item) => (
                      <Link
                        key={item.id}
                        href={`/crossadmit/${item.id}`}
                        className="block p-2 md:p-3 border border-gray-800 rounded-lg hover:bg-gray-800 hover:border-orange-500/40 transition-all"
                      >
                        <div className="text-xs md:text-sm font-medium text-white mb-1 line-clamp-1">
                          {item.university1}
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2">
                          vs
                        </div>
                        <div className="text-xs md:text-sm font-medium text-white mb-1 md:mb-2 line-clamp-1">
                          {item.university2}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs">
                          <span
                            className={`font-bold ${
                              item.percentage1 > item.percentage2
                                ? "text-green-400"
                                : "text-gray-500"
                            }`}
                          >
                            {item.percentage1}%
                          </span>
                          <span className="text-gray-500">vs</span>
                          <span
                            className={`font-bold ${
                              item.percentage2 > item.percentage1
                                ? "text-red-400"
                                : "text-gray-500"
                            }`}
                          >
                            {item.percentage2}%
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">데이터 준비 중입니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-8 md:pb-12">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-2xl font-bold text-white">최신 유학 영상</h2>
              <Link
                href="/videos"
                className="text-sm text-orange-400 hover:text-orange-300 font-medium"
              >
                더보기
              </Link>
            </div>
            {latestVideos.length === 0 ? (
              <p className="text-sm text-gray-500">아직 영상이 없습니다</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {latestVideos.map((video) => (
                  <a
                    key={video.id}
                    href={video.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-gray-800 rounded-lg overflow-hidden hover:border-orange-500/40 transition-colors bg-gray-950"
                  >
                    <img
                      src={video.thumbnail_url || "https://picsum.photos/640/360"}
                      alt={video.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-300 line-clamp-2">
                        {video.title}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function CrossAdmitPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-950 flex items-center justify-center">
          <p className="text-gray-400">Loading…</p>
        </main>
      }
    >
      <CrossAdmitPageInner />
    </Suspense>
  );
}
