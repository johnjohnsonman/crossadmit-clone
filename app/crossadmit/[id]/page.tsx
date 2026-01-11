"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import StructuredData from "@/components/StructuredData";

interface MajorStat {
  major: string;
  total: number;
  chose: number;
  percentage: number;
}

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
  majorStats?: {
    university1: MajorStat[];
    university2: MajorStat[];
  };
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

export default function CrossAdmitDetailPage() {
  const params = useParams();
  const comparisonId = (params.id as string) || "";
  const [comparison, setComparison] = useState<CrossAdmitRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/crossadmit");
        const data = await response.json();
        
        if (data.success && data.comparisons) {
          const found = data.comparisons.find((c: any) => c.id === comparisonId);
          if (found) {
            setComparison({
              id: found.id,
              university1: found.university1,
              university2: found.university2,
              totalAdmitted: found.totalAdmitted,
              choseUniversity1: found.choseUniversity1,
              choseUniversity2: found.choseUniversity2,
              percentage1: found.percentage1,
              percentage2: found.percentage2,
              confidenceInterval1: found.confidenceInterval1,
              confidenceInterval2: found.confidenceInterval2,
              majorStats: found.majorStats,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching comparison:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [comparisonId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f3f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </main>
    );
  }

  if (!comparison) {
    return (
      <main className="min-h-screen bg-[#f5f3f0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">비교를 찾을 수 없습니다</h1>
          <Link href="/crossadmit" className="text-blue-600 hover:underline">
            크로스어드밋으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const isSignificant = Math.abs(comparison.percentage1 - comparison.percentage2) > 5;

  // 구조화된 데이터 생성 (다국어 지원)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "StatisticalPopulation",
    name: `${comparison.university1} vs ${comparison.university2}`,
    alternateName: [
      `${comparison.university1} vs ${comparison.university2}`,
      `${comparison.university1} 对比 ${comparison.university2}`,
    ],
    description: `두 대학에 동시에 합격한 학생들의 선택 통계 | Admission statistics for students accepted to both universities | 同时被两所大学录取的学生的选择统计`,
    inLanguage: ["ko", "en", "zh-CN", "zh-TW", "es", "ja"],
    statistic: [
      {
        "@type": "StatisticalVariable",
        name: comparison.university1,
        value: comparison.percentage1,
        unitCode: "P1",
      },
      {
        "@type": "StatisticalVariable",
        name: comparison.university2,
        value: comparison.percentage2,
        unitCode: "P1",
      },
    ],
    populationType: "대학 합격자 | University Admitted Students | 大学录取学生",
    size: comparison.totalAdmitted,
    about: {
      "@type": "Thing",
      name: "Study in Korea | 留学韩国 | Estudiar en Corea",
      description: "Korean university admission information for international students",
    },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <main className="min-h-screen bg-[#f5f3f0]">
        <div className="container mx-auto px-4 py-8">
        <Link
          href="/crossadmit"
          className="text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block"
        >
          ← 크로스어드밋으로 돌아가기
        </Link>

        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              {/* 왼쪽 */}
              <div className="p-12 text-center">
                <div className={`text-7xl font-bold mb-4 ${
                  comparison.percentage1 > comparison.percentage2
                    ? "text-green-600"
                    : "text-gray-400"
                }`}>
                  {comparison.percentage1}%
                </div>
                <div className="text-base text-gray-500 mb-2">choose</div>
                <div className="text-2xl font-bold text-blue-600 mb-6">
                  {comparison.university1}
                </div>
                <div className="text-sm text-gray-500 mb-8">
                  95% confidence interval: {comparison.confidenceInterval1.min}% to {comparison.confidenceInterval1.max}%
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  {comparison.choseUniversity1.toLocaleString()}명 선택
                </div>
              </div>

              {/* 오른쪽 */}
              <div className="p-12 text-center">
                <div className={`text-7xl font-bold mb-4 ${
                  comparison.percentage2 > comparison.percentage1
                    ? "text-red-600"
                    : "text-gray-400"
                }`}>
                  {comparison.percentage2}%
                </div>
                <div className="text-base text-gray-500 mb-2">choose</div>
                <div className="text-2xl font-bold text-blue-600 mb-6">
                  {comparison.university2}
                </div>
                <div className="text-sm text-gray-500 mb-8">
                  95% confidence interval: {comparison.confidenceInterval2.min}% to {comparison.confidenceInterval2.max}%
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  {comparison.choseUniversity2.toLocaleString()}명 선택
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-12 py-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-700 mb-2">
                  총 <span className="font-bold">{comparison.totalAdmitted.toLocaleString()}</span>명이 두 대학에 동시에 합격했습니다
                </p>
                {isSignificant && (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ 통계적으로 유의미한 차이가 있습니다 (95% 신뢰구간)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 학과별 상세 통계 */}
          {comparison.majorStats && (comparison.majorStats.university1.length > 0 || comparison.majorStats.university2.length > 0) && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-tea-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">학과별 상세 통계</h2>
                <p className="text-sm text-gray-600 mt-1">각 학교의 학과별 선택 통계를 확인하세요</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                {/* 왼쪽: 첫 번째 대학의 학과별 통계 */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {comparison.university1}
                  </h3>
                  {comparison.majorStats.university1.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.majorStats.university1.map((majorStat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{majorStat.major}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {majorStat.total}명 합격 · {majorStat.chose}명 선택
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-lg font-bold ${
                              majorStat.percentage >= 50 ? "text-green-600" : "text-gray-600"
                            }`}>
                              {majorStat.percentage}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">학과별 데이터가 없습니다</p>
                  )}
                </div>

                {/* 오른쪽: 두 번째 대학의 학과별 통계 */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {comparison.university2}
                  </h3>
                  {comparison.majorStats.university2.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.majorStats.university2.map((majorStat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{majorStat.major}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {majorStat.total}명 합격 · {majorStat.chose}명 선택
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-lg font-bold ${
                              majorStat.percentage >= 50 ? "text-red-600" : "text-gray-600"
                            }`}>
                              {majorStat.percentage}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">학과별 데이터가 없습니다</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 유사한 대학 비교 */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {comparison.university1}와 유사한 대학으로 교체:
              </h3>
              <ul className="space-y-2">
                {getSimilarUniversities(comparison.university1).map((uni, idx) => (
                  <li key={idx}>
                    <Link
                      href={`/crossadmit?search=${encodeURIComponent(uni)}`}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      {uni}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {comparison.university2}와 유사한 대학으로 교체:
              </h3>
              <ul className="space-y-2">
                {getSimilarUniversities(comparison.university2).map((uni, idx) => (
                  <li key={idx}>
                    <Link
                      href={`/crossadmit?search=${encodeURIComponent(uni)}`}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      {uni}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 등록 버튼 */}
          <div className="mt-8 text-center">
            <Link
              href="/crossadmit/register"
              className="inline-block px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-colors"
            >
              내 학교 등록 인증하기 →
            </Link>
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
