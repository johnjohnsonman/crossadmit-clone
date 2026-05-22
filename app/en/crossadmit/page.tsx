"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import UniversityAutocomplete from "@/components/crossadmit/UniversityAutocomplete";

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

function pickDisplayName(u: { name_kr: string; name_en: string }): string {
  return u.name_en.trim() || u.name_kr;
}

export default function CrossAdmitPageEN() {
  const [comparisons, setComparisons] = useState<CrossAdmitRecord[]>([]);
  const [popularComparisons, setPopularComparisons] = useState<PopularComparison[]>([]);
  const [latestVideos, setLatestVideos] = useState<VideoPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);

  const [univAName, setUnivAName] = useState("");
  const [univBName, setUnivBName] = useState("");
  const [univAId, setUnivAId] = useState<number | null>(null);
  const [univBId, setUnivBId] = useState<number | null>(null);
  const [vsCompareActive, setVsCompareActive] = useState(false);

  const itemsPerPage = 10;

  const fetchComparisons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        stats: "1",
        sort: sortOption,
        locale: "en",
      });
      if (vsCompareActive && univAId !== null && univBId !== null) {
        params.set("univ_a", String(univAId));
        params.set("univ_b", String(univBId));
      }
      const response = await fetch(`/api/cross-comparisons?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const stats = (data.stats ?? []) as ApiStat[];
      setComparisons(mapStatsToRecords(stats));
    } catch (error) {
      console.error("[CrossAdmit EN] Error fetching data:", error);
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
      setPopularLoading(true);
      try {
        const response = await fetch(
          "/api/cross-comparisons?stats=1&sort=popular&locale=en",
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
        console.error("[CrossAdmit EN] Error fetching popular:", error);
        setPopularComparisons([]);
      } finally {
        setPopularLoading(false);
      }
    };
    void fetchPopular();
  }, []);

  const handleVsCompare = () => {
    if (univAId === null || univBId === null) return;
    if (univAId === univBId) return;
    setVsCompareActive(true);
    setCurrentPage(1);
  };

  const clearVsCompare = () => {
    setVsCompareActive(false);
    setUnivAName("");
    setUnivBName("");
    setUnivAId(null);
    setUnivBId(null);
    setCurrentPage(1);
  };

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
        console.error("[CrossAdmit EN] Error fetching videos:", error);
      }
    };
    void fetchLatestVideos();
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CrossAdmit | 크로스어드밋 | 交叉录取",
    alternateName: ["크로스어드밋", "交叉录取"],
    url: "https://crossadmit.com",
    description:
      "Compare university admission statistics when students are accepted to multiple universities | 두 대학에 동시에 합격했을 때 학생들의 선택 통계",
    inLanguage: ["en", "ko", "zh-CN", "zh-TW", "es", "ja"],
    about: {
      "@type": "Thing",
      name: "Study in Korea",
      description:
        "Korean university admission statistics and information for international students",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://crossadmit.com/en/crossadmit?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const sortBtnClass = (active: boolean) =>
    `px-3 md:px-4 py-2 text-sm md:text-base font-medium rounded-md transition-colors whitespace-nowrap ${
      active
        ? "bg-blue-500 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  const emptyMessage = vsCompareActive
    ? "No comparison data found."
    : searchQuery.trim()
      ? "No results found."
      : "No comparison data found.";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-[#f5f3f0]">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 md:py-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
              CrossAdmit
            </h1>
            <p className="text-sm md:text-lg text-gray-600 mb-1 md:mb-2">
              When admitted to two universities simultaneously, which one do students choose?
            </p>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
              Statistically significant differences are indicated by color (95% confidence
              interval)
            </p>
            <Link
              href="/en/crossadmit/register"
              className="inline-block px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-colors"
            >
              Register Your School →
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
            <div className="lg:col-span-3 space-y-4 md:space-y-6">
              {/* Compare two universities directly */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm md:text-base font-bold text-gray-900">
                    Compare Two Universities
                  </h2>
                  {vsCompareActive && (
                    <button
                      type="button"
                      onClick={clearVsCompare}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
                      aria-label="Clear comparison"
                    >
                      <span className="text-lg leading-none">×</span>
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                  <UniversityAutocomplete
                    locale="en"
                    value={univAName}
                    univId={univAId}
                    onChange={setUnivAName}
                    onSelect={(u) => {
                      setUnivAName(pickDisplayName(u));
                      setUnivAId(u.id);
                    }}
                    onClearId={() => setUnivAId(null)}
                    placeholder="University A"
                  />
                  <span className="text-center text-sm font-bold text-gray-500 shrink-0 py-1">
                    VS
                  </span>
                  <UniversityAutocomplete
                    locale="en"
                    value={univBName}
                    univId={univBId}
                    onChange={setUnivBName}
                    onSelect={(u) => {
                      setUnivBName(pickDisplayName(u));
                      setUnivBId(u.id);
                    }}
                    onClearId={() => setUnivBId(null)}
                    placeholder="University B"
                  />
                  <button
                    type="button"
                    onClick={handleVsCompare}
                    disabled={
                      univAId === null ||
                      univBId === null ||
                      univAId === univBId
                    }
                    className="shrink-0 px-4 py-2 text-sm md:text-base font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Compare
                  </button>
                </div>
                {vsCompareActive && univAName && univBName && (
                  <p className="mt-3 text-xs md:text-sm text-blue-700 bg-blue-50 rounded-md px-3 py-2">
                    Results for{" "}
                    <span className="font-semibold">{univAName}</span>
                    {" vs "}
                    <span className="font-semibold">{univBName}</span>
                  </p>
                )}
              </div>

              {/* Search and sort */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search university..."
                    disabled={vsCompareActive}
                    className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSortOption("latest")}
                      disabled={vsCompareActive}
                      className={sortBtnClass(sortOption === "latest")}
                    >
                      Latest
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOption("random")}
                      disabled={vsCompareActive}
                      className={sortBtnClass(sortOption === "random")}
                    >
                      Random
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOption("popular")}
                      disabled={vsCompareActive}
                      className={sortBtnClass(sortOption === "popular")}
                    >
                      Most Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Comparison list */}
              <div className="space-y-2 md:space-y-3">
                {loading ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                    Loading...
                  </div>
                ) : paginatedComparisons.length > 0 ? (
                  paginatedComparisons.map((comparison) => (
                    <Link
                      key={comparison.id}
                      href={`/en/crossadmit/${comparison.id}`}
                      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between p-3 md:p-4">
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <div className="text-center shrink-0">
                            <div
                              className={`text-lg md:text-2xl font-bold whitespace-nowrap ${
                                comparison.percentage1 > comparison.percentage2
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {comparison.percentage1}%
                            </div>
                            <div className="text-[10px] md:text-xs text-gray-500">
                              choose
                            </div>
                          </div>
                          <div className="text-sm md:text-base font-semibold text-blue-600 truncate">
                            {comparison.university1}
                          </div>
                        </div>

                        <div className="px-2 md:px-4 text-xs md:text-sm text-gray-400 font-medium">
                          vs
                        </div>

                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 justify-end">
                          <div className="text-sm md:text-base font-semibold text-blue-600 truncate text-right">
                            {comparison.university2}
                          </div>
                          <div className="text-center shrink-0">
                            <div
                              className={`text-lg md:text-2xl font-bold whitespace-nowrap ${
                                comparison.percentage2 > comparison.percentage1
                                  ? "text-red-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {comparison.percentage2}%
                            </div>
                            <div className="text-[10px] md:text-xs text-gray-500">
                              choose
                            </div>
                          </div>
                        </div>

                        <div className="ml-3 md:ml-4 text-xs md:text-sm text-gray-500 whitespace-nowrap hidden lg:block max-w-[140px] text-right">
                          Total {comparison.totalAdmitted} people admitted to
                          both
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                    {emptyMessage}
                  </div>
                )}
              </div>

              {!vsCompareActive && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
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
                                ? "bg-blue-500 text-white"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 md:sticky md:top-24">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">
                  Popular Comparisons
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {popularLoading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : popularComparisons.length > 0 ? (
                    popularComparisons.map((item) => (
                      <Link
                        key={item.id}
                        href={`/en/crossadmit/${item.id}`}
                        className="block p-2 md:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
                      >
                        <div className="text-xs md:text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                          {item.university1}
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2">
                          vs
                        </div>
                        <div className="text-xs md:text-sm font-medium text-gray-900 mb-1 md:mb-2 line-clamp-1">
                          {item.university2}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs">
                          <span
                            className={`font-bold ${
                              item.percentage1 > item.percentage2
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            {item.percentage1}% choose
                          </span>
                          <span className="text-gray-400">vs</span>
                          <span
                            className={`font-bold ${
                              item.percentage2 > item.percentage1
                                ? "text-red-600"
                                : "text-gray-400"
                            }`}
                          >
                            {item.percentage2}% choose
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No comparison data found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-8 md:pb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                Latest Study Abroad Videos
              </h2>
              <Link
                href="/videos"
                className="text-sm text-tea-600 hover:text-tea-700 font-medium"
              >
                View all
              </Link>
            </div>
            {latestVideos.length === 0 ? (
              <p className="text-sm text-gray-500">No videos yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {latestVideos.map((video) => (
                  <a
                    key={video.id}
                    href={video.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <img
                      src={video.thumbnail_url || "https://picsum.photos/640/360"}
                      alt={video.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
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
