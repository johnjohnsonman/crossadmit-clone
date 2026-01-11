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

export default function CrossAdmitPage() {
  const [comparisons, setComparisons] = useState<CrossAdmitRecord[]>([]);
  const [popularComparisons, setPopularComparisons] = useState<PopularComparison[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredComparisons = comparisons.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.university1.toLowerCase().includes(query) ||
      c.university2.toLowerCase().includes(query)
    );
  });

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
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">크로스어드밋</h1>
          <p className="text-lg text-gray-600 mb-2">
            두 대학에 동시에 합격했을 때, 학생들은 어디를 선택할까요?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            통계적으로 유의미한 차이가 있는 경우 색상으로 표시됩니다 (95% 신뢰구간)
          </p>
          <Link
            href="/crossadmit/register"
            className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            내 학교 등록 인증하기 →
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            {/* 검색 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="대학명 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* 비교 목록 */}
            <div className="space-y-6">
              {filteredComparisons.map((comparison) => (
                <Link
                  key={comparison.id}
                  href={`/crossadmit/${comparison.id}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    {/* 왼쪽: 대학 1 */}
                    <div className="p-8 text-center">
                      <div className={`text-6xl font-bold mb-2 ${
                        comparison.percentage1 > comparison.percentage2
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}>
                        {comparison.percentage1}%
                      </div>
                      <div className="text-sm text-gray-500 mb-1">choose</div>
                      <div className="text-lg font-semibold text-blue-600 mb-4">
                        {comparison.university1}
                      </div>
                      <div className="text-xs text-gray-500">
                        95% confidence interval: {comparison.confidenceInterval1.min}% to {comparison.confidenceInterval1.max}%
                      </div>
                    </div>

                    {/* 오른쪽: 대학 2 */}
                    <div className="p-8 text-center">
                      <div className={`text-6xl font-bold mb-2 ${
                        comparison.percentage2 > comparison.percentage1
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}>
                        {comparison.percentage2}%
                      </div>
                      <div className="text-sm text-gray-500 mb-1">choose</div>
                      <div className="text-lg font-semibold text-blue-600 mb-4">
                        {comparison.university2}
                      </div>
                      <div className="text-xs text-gray-500">
                        95% confidence interval: {comparison.confidenceInterval2.min}% to {comparison.confidenceInterval2.max}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                    <div className="text-center text-sm text-gray-600">
                      총 {comparison.totalAdmitted.toLocaleString()}명이 두 대학에 동시에 합격
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">인기 비교</h3>
              <div className="space-y-3">
                {popularComparisons.map((item) => (
                  <Link
                    key={item.id}
                    href={`/crossadmit/${item.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {item.university1}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">vs</div>
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      {item.university2}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
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
