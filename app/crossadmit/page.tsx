"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

// 샘플 데이터 (API에 데이터가 없을 때 사용)
function generateSampleData(): CrossAdmitRecord[] {
  const comparisons: CrossAdmitRecord[] = [
    {
      id: "ucla-vs-usc",
      university1: "University of California, Los Angeles",
      university2: "University of Southern California",
      totalAdmitted: 1000,
      choseUniversity1: 590,
      choseUniversity2: 410,
      percentage1: 59,
      percentage2: 41,
      confidenceInterval1: { min: 55.7, max: 61.7 },
      confidenceInterval2: { min: 38.3, max: 44.3 },
    },
    {
      id: "seoul-vs-yonsei",
      university1: "서울대학교",
      university2: "연세대학교(서울캠)",
      totalAdmitted: 850,
      choseUniversity1: 510,
      choseUniversity2: 340,
      percentage1: 60,
      percentage2: 40,
      confidenceInterval1: { min: 56.5, max: 63.2 },
      confidenceInterval2: { min: 36.8, max: 43.5 },
    },
  ];
  return comparisons;
}

type SortOption = "random" | "data-desc";

export default function CrossAdmitPage() {
  const [comparisons, setComparisons] = useState<CrossAdmitRecord[]>([]);
  const [popularComparisons, setPopularComparisons] = useState<PopularComparison[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("random");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/crossadmit");
        const data = await response.json();
        
        if (data.success && data.comparisons && data.comparisons.length > 0) {
          // API 데이터를 CrossAdmitRecord 형식으로 변환
          const apiComparisons: CrossAdmitRecord[] = data.comparisons.map((c: any) => ({
            id: c.id,
            university1: c.university1,
            university2: c.university2,
            totalAdmitted: c.totalAdmitted,
            choseUniversity1: c.choseUniversity1,
            choseUniversity2: c.choseUniversity2,
            percentage1: c.percentage1,
            percentage2: c.percentage2,
            confidenceInterval1: c.confidenceInterval1,
            confidenceInterval2: c.confidenceInterval2,
          }));
          
          setComparisons(apiComparisons);
          
          // 인기 비교 목록
          const popular = apiComparisons.slice(0, 5).map((c) => ({
            id: c.id,
            university1: c.university1,
            university2: c.university2,
            percentage1: c.percentage1,
            percentage2: c.percentage2,
          }));
          setPopularComparisons(popular);
        } else {
          // API에 데이터가 없으면 샘플 데이터 사용
          const sampleData = generateSampleData();
          setComparisons(sampleData);
          
          const popular = sampleData.slice(0, 5).map((c) => ({
            id: c.id,
            university1: c.university1,
            university2: c.university2,
            percentage1: c.percentage1,
            percentage2: c.percentage2,
          }));
          setPopularComparisons(popular);
        }
      } catch (error) {
        console.error("Error fetching crossadmit data:", error);
        // 에러 발생 시 샘플 데이터 사용
        const sampleData = generateSampleData();
        setComparisons(sampleData);
        
        const popular = sampleData.slice(0, 5).map((c) => ({
          id: c.id,
          university1: c.university1,
          university2: c.university2,
          percentage1: c.percentage1,
          percentage2: c.percentage2,
        }));
        setPopularComparisons(popular);
      }
    };

    fetchData();
  }, []);

  // 필터링 및 정렬
  const filteredComparisons = comparisons
    .filter((c) => {
      const query = searchQuery.toLowerCase();
      return (
        c.university1.toLowerCase().includes(query) ||
        c.university2.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortOption === "data-desc") {
        // 데이터 많은 순 (totalAdmitted 내림차순)
        return b.totalAdmitted - a.totalAdmitted;
      } else {
        // 랜덤순 (매번 다른 순서를 위해 id 기반 정렬)
        return 0; // 필터링 후 랜덤 셔플
      }
    });

  // 랜덤 정렬을 위한 셔플 (sortOption이 "random"일 때)
  const shuffledComparisons = sortOption === "random" 
    ? [...filteredComparisons].sort(() => Math.random() - 0.5)
    : filteredComparisons;

  // 페이지네이션 계산
  const totalPages = Math.ceil(shuffledComparisons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComparisons = shuffledComparisons.slice(startIndex, endIndex);

  // 검색어나 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  // 구조화된 데이터 생성 (다국어 지원)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "크로스어드밋 | CrossAdmit | 交叉录取",
    alternateName: ["CrossAdmit", "交叉录取"],
    url: "https://crossadmit.com",
    description: "두 대학에 동시에 합격했을 때 학생들의 선택 통계 | Compare university admission statistics when students are accepted to multiple universities | 比较同时被多所大学录取时的学生选择统计",
    inLanguage: ["ko", "en", "zh-CN", "zh-TW", "es", "ja"],
    about: {
      "@type": "Thing",
      name: "Study in Korea | 留学韩国 | Estudiar en Corea",
      description: "Korean university admission statistics and information for international students",
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-[#f5f3f0]">
        {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">크로스어드밋</h1>
          <p className="text-sm md:text-lg text-gray-600 mb-1 md:mb-2">
            두 대학에 동시에 합격했을 때, 학생들은 어디를 선택할까요?
          </p>
          <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
            통계적으로 유의미한 차이가 있는 경우 색상으로 표시됩니다 (95% 신뢰구간)
          </p>
          <Link
            href="/crossadmit/register"
            className="inline-block px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            내 학교 등록 인증하기 →
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            {/* 검색 및 필터 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="대학명 검색..."
                    className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortOption("random")}
                    className={`px-4 py-2 text-sm md:text-base font-medium rounded-md transition-colors whitespace-nowrap ${
                      sortOption === "random"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    랜덤순
                  </button>
                  <button
                    onClick={() => setSortOption("data-desc")}
                    className={`px-4 py-2 text-sm md:text-base font-medium rounded-md transition-colors whitespace-nowrap ${
                      sortOption === "data-desc"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    데이터많은 순
                  </button>
                </div>
              </div>
            </div>

            {/* 비교 목록 */}
            <div className="space-y-2 md:space-y-3">
              {paginatedComparisons.length > 0 ? (
                paginatedComparisons.map((comparison) => (
                  <Link
                    key={comparison.id}
                    href={`/crossadmit/${comparison.id}`}
                    className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between p-3 md:p-4">
                      {/* 왼쪽: 대학 1 */}
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                        <div className={`text-lg md:text-2xl font-bold whitespace-nowrap ${
                          comparison.percentage1 > comparison.percentage2
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}>
                          {comparison.percentage1}%
                        </div>
                        <div className="text-sm md:text-base font-semibold text-blue-600 truncate">
                          {comparison.university1}
                        </div>
                      </div>

                      {/* 중앙: VS */}
                      <div className="px-2 md:px-4 text-xs md:text-sm text-gray-400 font-medium">
                        vs
                      </div>

                      {/* 오른쪽: 대학 2 */}
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 justify-end">
                        <div className="text-sm md:text-base font-semibold text-blue-600 truncate text-right">
                          {comparison.university2}
                        </div>
                        <div className={`text-lg md:text-2xl font-bold whitespace-nowrap ${
                          comparison.percentage2 > comparison.percentage1
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}>
                          {comparison.percentage2}%
                        </div>
                      </div>

                      {/* 데이터 수 */}
                      <div className="ml-3 md:ml-4 text-xs md:text-sm text-gray-500 whitespace-nowrap hidden md:block">
                        ({comparison.totalAdmitted}명)
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 md:mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  이전
                </button>
                
                <div className="flex gap-1 md:gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // 현재 페이지 주변 2페이지씩만 표시
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
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
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-md transition-colors ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  다음
                </button>
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">인기 비교</h3>
              <div className="space-y-2 md:space-y-3">
                {popularComparisons.map((item) => (
                  <Link
                    key={item.id}
                    href={`/crossadmit/${item.id}`}
                    className="block p-2 md:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
                  >
                    <div className="text-xs md:text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                      {item.university1}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2">vs</div>
                    <div className="text-xs md:text-sm font-medium text-gray-900 mb-1 md:mb-2 line-clamp-1">
                      {item.university2}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs">
                      <span className={`font-bold ${
                        item.percentage1 > item.percentage2 ? "text-green-600" : "text-gray-400"
                      }`}>
                        {item.percentage1}%
                      </span>
                      <span className="text-gray-400">vs</span>
                      <span className={`font-bold ${
                        item.percentage2 > item.percentage1 ? "text-red-600" : "text-gray-400"
                      }`}>
                        {item.percentage2}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
    </>
  );
}

function getSimilarUniversities(university: string): string[] {
  const similarMap: Record<string, string[]> = {
    "University of California, Los Angeles": [
      "University of California, Berkeley",
      "University of California, San Diego",
      "Stanford University",
      "Harvard University",
      "University of California, Irvine",
      "Yale University",
      "University of Michigan - Ann Arbor",
      "University of California, Santa Barbara",
      "New York University",
    ],
    "University of Southern California": [
      "University of California, Berkeley",
      "Stanford University",
      "University of California, San Diego",
      "Harvard University",
      "New York University",
      "University of California, Irvine",
      "University of California, Santa Barbara",
      "University of Michigan - Ann Arbor",
      "Yale University",
    ],
    "서울대학교": [
      "연세대학교(서울캠)",
      "고려대학교(서울캠)",
      "성균관대학교",
      "한양대학교",
      "중앙대학교",
    ],
    "연세대학교(서울캠)": [
      "서울대학교",
      "고려대학교(서울캠)",
      "성균관대학교",
      "한양대학교",
      "중앙대학교",
    ],
    "고려대학교(서울캠)": [
      "서울대학교",
      "연세대학교(서울캠)",
      "성균관대학교",
      "한양대학교",
      "중앙대학교",
    ],
    "Stanford University": [
      "Harvard University",
      "MIT",
      "UC Berkeley",
      "Yale University",
      "Princeton University",
    ],
    "UC Berkeley": [
      "Stanford University",
      "UCLA",
      "UC San Diego",
      "University of Michigan - Ann Arbor",
      "University of Virginia",
    ],
    "Harvard University": [
      "Stanford University",
      "MIT",
      "Yale University",
      "Princeton University",
      "Columbia University",
    ],
    "MIT": [
      "Stanford University",
      "Harvard University",
      "UC Berkeley",
      "Caltech",
      "Carnegie Mellon University",
    ],
  };

  return similarMap[university] || [];
}
