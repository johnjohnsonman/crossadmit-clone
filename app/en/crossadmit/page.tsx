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

// Sample data (used when API has no data)
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
      university1: "Seoul National University",
      university2: "Yonsei University",
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

export default function CrossAdmitPageEN() {
  const [comparisons, setComparisons] = useState<CrossAdmitRecord[]>([]);
  const [popularComparisons, setPopularComparisons] = useState<PopularComparison[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComparison, setSelectedComparison] = useState<CrossAdmitRecord | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("random");

  useEffect(() => {
    // Fetch data from API
    fetch("/api/crossadmit")
      .then((res) => res.json())
      .then((data) => {
        if (data.comparisons && data.comparisons.length > 0) {
          setComparisons(data.comparisons);
          setSelectedComparison(data.comparisons[0]);
        } else {
          const sample = generateSampleData();
          setComparisons(sample);
          setSelectedComparison(sample[0]);
        }

        if (data.popularComparisons) {
          setPopularComparisons(data.popularComparisons);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        const sample = generateSampleData();
        setComparisons(sample);
        setSelectedComparison(sample[0]);
      });
  }, []);

  // 필터링 및 정렬
  const filteredComparisons = comparisons
    .filter(
      (comp) =>
        comp.university1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.university2.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "data-desc") {
        return b.totalAdmitted - a.totalAdmitted;
      } else {
        return 0;
      }
    });

  // 랜덤 정렬을 위한 셔플
  const shuffledComparisons = sortOption === "random" 
    ? [...filteredComparisons].sort(() => Math.random() - 0.5)
    : filteredComparisons;

  // Structured data generation (multilingual support)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CrossAdmit | 크로스어드밋 | 交叉录取",
    alternateName: ["크로스어드밋", "交叉录取"],
    url: "https://crossadmit.com",
    description: "Compare university admission statistics when students are accepted to multiple universities | 두 대학에 동시에 합격했을 때 학생들의 선택 통계 | 比较同时被多所大学录取时的学生选择统计",
    inLanguage: ["en", "ko", "zh-CN", "zh-TW", "es", "ja"],
    about: {
      "@type": "Thing",
      name: "Study in Korea | 留学韩国 | Estudiar en Corea",
      description: "Korean university admission statistics and information for international students",
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-[#f5f3f0]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 md:py-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">CrossAdmit</h1>
            <p className="text-sm md:text-lg text-gray-600 mb-1 md:mb-2">
              When admitted to two universities simultaneously, which one do students choose?
            </p>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
              Statistically significant differences are indicated by color (95% confidence interval)
            </p>
            <div className="flex gap-3">
              <Link
                href="/en/crossadmit/register"
                className="inline-block px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-colors"
              >
                Register Your School →
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search university name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                      Random
                    </button>
                    <button
                      onClick={() => setSortOption("data-desc")}
                      className={`px-4 py-2 text-sm md:text-base font-medium rounded-md transition-colors whitespace-nowrap ${
                        sortOption === "data-desc"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Most Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Comparison Display */}
              {selectedComparison && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 md:mb-6">
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    {/* Left University */}
                    <div className="p-4 md:p-12 text-center">
                      <div
                        className={`text-3xl md:text-7xl font-bold mb-1 md:mb-4 ${
                          selectedComparison.percentage1 > selectedComparison.percentage2
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {selectedComparison.percentage1}%
                      </div>
                      <div className="text-xs md:text-base text-gray-500 mb-1 md:mb-2">choose</div>
                      <div className="text-sm md:text-2xl font-bold text-blue-600 mb-2 md:mb-6 line-clamp-2">
                        {selectedComparison.university1}
                      </div>
                      <div className="text-[10px] md:text-sm text-gray-500 hidden md:block">
                        95% confidence interval: {selectedComparison.confidenceInterval1.min}% to{" "}
                        {selectedComparison.confidenceInterval1.max}%
                      </div>
                    </div>

                    {/* Right University */}
                    <div className="p-4 md:p-12 text-center">
                      <div
                        className={`text-3xl md:text-7xl font-bold mb-1 md:mb-4 ${
                          selectedComparison.percentage2 > selectedComparison.percentage1
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      >
                        {selectedComparison.percentage2}%
                      </div>
                      <div className="text-xs md:text-base text-gray-500 mb-1 md:mb-2">choose</div>
                      <div className="text-sm md:text-2xl font-bold text-blue-600 mb-2 md:mb-6 line-clamp-2">
                        {selectedComparison.university2}
                      </div>
                      <div className="text-[10px] md:text-sm text-gray-500 hidden md:block">
                        95% confidence interval: {selectedComparison.confidenceInterval2.min}% to{" "}
                        {selectedComparison.confidenceInterval2.max}%
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 md:px-12 py-2 md:py-4 text-center text-xs md:text-sm text-gray-600">
                    Total {selectedComparison.totalAdmitted} people admitted to both universities
                    simultaneously
                  </div>
                </div>
              )}

              {/* Comparison List */}
              {shuffledComparisons.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                  <h2 className="text-base md:text-xl font-bold text-gray-900 mb-3 md:mb-4">All Comparisons</h2>
                  <div className="space-y-2 md:space-y-3">
                    {shuffledComparisons.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => setSelectedComparison(comp)}
                        className={`p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedComparison?.id === comp.id
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm md:text-base font-semibold text-gray-900 line-clamp-1">
                              {comp.university1} vs {comp.university2}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500 mt-1">
                              {comp.totalAdmitted} people admitted
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm md:text-lg font-bold text-gray-900">
                              {comp.percentage1}% vs {comp.percentage2}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 md:sticky md:top-24">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Popular Comparisons</h3>
                <div className="space-y-2 md:space-y-3">
                  {popularComparisons.length > 0 ? (
                    popularComparisons.map((item) => (
                      <Link
                        key={item.id}
                        href={`/en/crossadmit/${item.id}`}
                        className="block p-2 md:p-3 border border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-all"
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
                    ))
                  ) : (
                    <div className="text-xs md:text-sm text-gray-500">No popular comparisons yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
