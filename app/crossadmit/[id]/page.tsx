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
    majorMatches?: Array<{
      major1: string;
      major2: string;
      total: number;
      chose1: number;
      chose2: number;
      percentage1: number;
      percentage2: number;
    }>;
  };
}

interface SubmissionRecord {
  id: string;
  admittedUniversities: string[];
  registeredUniversity: string;
  admittedMajors: Record<string, string>;
  registeredMajor: string;
  createdAt: string;
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
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // comparisonId로 직접 조회
        const response = await fetch(`/api/crossadmit?id=${encodeURIComponent(comparisonId)}`);
        const data = await response.json();
        
        if (data.success && data.comparison) {
          const found = data.comparison;
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

          // 개별 제출 데이터 가져오기
          const submissionsResponse = await fetch(
            `/api/crossadmit?university1=${encodeURIComponent(found.university1)}&university2=${encodeURIComponent(found.university2)}`
          );
          const submissionsData = await submissionsResponse.json();
          if (submissionsData.success && submissionsData.submissions) {
            setSubmissions(submissionsData.submissions);
          }
        } else {
          // comparisonId로 찾지 못하면 전체 목록에서 검색
          const allResponse = await fetch("/api/crossadmit");
          const allData = await allResponse.json();
          
          if (allData.success && allData.comparisons) {
            const found = allData.comparisons.find((c: any) => c.id === comparisonId);
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

              // 개별 제출 데이터 가져오기
              const submissionsResponse = await fetch(
                `/api/crossadmit?university1=${encodeURIComponent(found.university1)}&university2=${encodeURIComponent(found.university2)}`
              );
              const submissionsData = await submissionsResponse.json();
              if (submissionsData.success && submissionsData.submissions) {
                setSubmissions(submissionsData.submissions);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching comparison:", error);
      } finally {
        setLoading(false);
      }
    };

    if (comparisonId) {
      fetchData();
    } else {
      setLoading(false);
    }
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

  // comparisonId에서 대학명 추출 시도
  const parseUniversityNames = (id: string): { uni1: string; uni2: string } | null => {
    try {
      const decoded = decodeURIComponent(id);
      const parts = decoded.split("-vs-");
      if (parts.length === 2) {
        // 괄호 복원 시도 (서울캠 -> (서울캠))
        let uni1 = parts[0];
        let uni2 = parts[1];
        
        // 일반적인 패턴 복원
        uni1 = uni1.replace(/(서울캠|서울캠퍼스)/, "($1)");
        uni2 = uni2.replace(/(서울캠|서울캠퍼스)/, "($1)");
        uni1 = uni1.replace(/(안산캠|안산캠퍼스)/, "($1)");
        uni2 = uni2.replace(/(안산캠|안산캠퍼스)/, "($1)");
        uni1 = uni1.replace(/(수원캠|수원캠퍼스)/, "($1)");
        uni2 = uni2.replace(/(수원캠|수원캠퍼스)/, "($1)");
        
        return { uni1, uni2 };
      }
    } catch (e) {
      // 파싱 실패
    }
    return null;
  };

  // 데이터가 없을 때 URL에서 대학명 추출
  const parsedNames = !comparison && comparisonId ? parseUniversityNames(comparisonId) : null;
  
  if (!comparison && !parsedNames) {
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

  // 파싱된 대학명으로 기본 비교 데이터 생성
  const displayComparison = comparison || (parsedNames ? {
    id: comparisonId,
    university1: parsedNames.uni1,
    university2: parsedNames.uni2,
    totalAdmitted: 0,
    choseUniversity1: 0,
    choseUniversity2: 0,
    percentage1: 0,
    percentage2: 0,
    confidenceInterval1: { min: 0, max: 0 },
    confidenceInterval2: { min: 0, max: 0 },
    majorStats: undefined,
  } : null);

  if (!displayComparison) {
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

  const isSignificant = Math.abs(displayComparison.percentage1 - displayComparison.percentage2) > 5;

  // 구조화된 데이터 생성 (다국어 지원)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "StatisticalPopulation",
    name: `${displayComparison.university1} vs ${displayComparison.university2}`,
    alternateName: [
      `${displayComparison.university1} vs ${displayComparison.university2}`,
      `${displayComparison.university1} 对比 ${displayComparison.university2}`,
    ],
    description: `두 대학에 동시에 합격한 학생들의 선택 통계 | Admission statistics for students accepted to both universities | 同时被两所大学录取的学生的选择统计`,
    inLanguage: ["ko", "en", "zh-CN", "zh-TW", "es", "ja"],
    statistic: [
      {
        "@type": "StatisticalVariable",
        name: displayComparison.university1,
        value: displayComparison.percentage1,
        unitCode: "P1",
      },
      {
        "@type": "StatisticalVariable",
        name: displayComparison.university2,
        value: displayComparison.percentage2,
        unitCode: "P1",
      },
    ],
    populationType: "대학 합격자 | University Admitted Students | 大学录取学生",
    size: displayComparison.totalAdmitted,
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
                  displayComparison.percentage1 > displayComparison.percentage2
                    ? "text-green-600"
                    : "text-gray-400"
                }`}>
                  {displayComparison.percentage1}%
                </div>
                <div className="text-base text-gray-500 mb-2">choose</div>
                <div className="text-2xl font-bold text-blue-600 mb-6">
                  {displayComparison.university1}
                </div>
                {displayComparison.totalAdmitted > 0 && (
                  <>
                    <div className="text-sm text-gray-500 mb-8">
                      95% confidence interval: {displayComparison.confidenceInterval1.min}% to {displayComparison.confidenceInterval1.max}%
                    </div>
                    <div className="text-lg font-semibold text-gray-700 mb-2">
                      {displayComparison.choseUniversity1.toLocaleString()}명 선택
                    </div>
                  </>
                )}
                {displayComparison.totalAdmitted === 0 && (
                  <div className="text-sm text-gray-500 mb-8">
                    아직 데이터가 없습니다
                  </div>
                )}
              </div>

              {/* 오른쪽 */}
              <div className="p-12 text-center">
                <div className={`text-7xl font-bold mb-4 ${
                  displayComparison.percentage2 > displayComparison.percentage1
                    ? "text-red-600"
                    : "text-gray-400"
                }`}>
                  {displayComparison.percentage2}%
                </div>
                <div className="text-base text-gray-500 mb-2">choose</div>
                <div className="text-2xl font-bold text-blue-600 mb-6">
                  {displayComparison.university2}
                </div>
                {displayComparison.totalAdmitted > 0 && (
                  <>
                    <div className="text-sm text-gray-500 mb-8">
                      95% confidence interval: {displayComparison.confidenceInterval2.min}% to {displayComparison.confidenceInterval2.max}%
                    </div>
                    <div className="text-lg font-semibold text-gray-700 mb-2">
                      {displayComparison.choseUniversity2.toLocaleString()}명 선택
                    </div>
                  </>
                )}
                {displayComparison.totalAdmitted === 0 && (
                  <div className="text-sm text-gray-500 mb-8">
                    아직 데이터가 없습니다
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-12 py-6 border-t border-gray-200">
              <div className="text-center">
                {displayComparison.totalAdmitted > 0 ? (
                  <>
                    <p className="text-gray-700 mb-2">
                      총 <span className="font-bold">{displayComparison.totalAdmitted.toLocaleString()}</span>명이 두 대학에 동시에 합격했습니다
                    </p>
                    {isSignificant && (
                      <p className="text-sm text-green-600 font-medium">
                        ✓ 통계적으로 유의미한 차이가 있습니다 (95% 신뢰구간)
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-700 mb-2">
                    아직 이 비교에 대한 데이터가 없습니다. 첫 번째로 등록해보세요!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 학과별 상세 통계 */}
          {displayComparison.majorStats && (
            <>
              {/* 학과 매칭 통계 - 어떤 학과끼리 붙었는지 */}
              {comparison.majorStats.majorMatches && comparison.majorStats.majorMatches.length > 0 && (
                <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">학과별 비교 통계</h2>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">어떤 학과끼리 붙었고 어디에 등록했는지 확인하세요</p>
                  </div>
                  
                  <div className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4">
                      {displayComparison.majorStats.majorMatches.map((match, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="p-3 md:p-4">
                            {/* 학과 매칭 헤더 */}
                            <div className="flex items-center justify-between mb-3 md:mb-4">
                              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                <div className="bg-blue-100 text-blue-700 px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-semibold truncate">
                                  {displayComparison.university1}
                                </div>
                                <span className="text-gray-400 font-medium text-xs md:text-sm">vs</span>
                                <div className="bg-green-100 text-green-700 px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-semibold truncate">
                                  {displayComparison.university2}
                                </div>
                              </div>
                              <div className="text-xs md:text-sm text-gray-500 ml-2 whitespace-nowrap">
                                총 {match.total}명
                              </div>
                            </div>

                            {/* 학과명 */}
                            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                              <div className="flex-1 bg-white px-3 md:px-4 py-2 rounded-md border border-blue-200">
                                <div className="text-xs text-gray-500 mb-1">학과</div>
                                <div className="text-sm md:text-base font-semibold text-blue-700">{match.major1}</div>
                              </div>
                              <div className="text-gray-400 font-medium text-sm md:text-base">vs</div>
                              <div className="flex-1 bg-white px-3 md:px-4 py-2 rounded-md border border-green-200">
                                <div className="text-xs text-gray-500 mb-1">학과</div>
                                <div className="text-sm md:text-base font-semibold text-green-700">{match.major2}</div>
                              </div>
                            </div>

                            {/* 선택 통계 */}
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                              <div className="bg-white rounded-md p-3 md:p-4 border-2 border-blue-300">
                                <div className="text-xs text-gray-500 mb-1 md:mb-2">등록 선택</div>
                                <div className={`text-xl md:text-3xl font-bold mb-1 ${
                                  match.percentage1 >= 50 ? "text-blue-600" : "text-gray-400"
                                }`}>
                                  {match.percentage1}%
                                </div>
                                <div className="text-xs md:text-sm text-gray-600">
                                  {match.chose1}명 / {match.total}명
                                </div>
                              </div>
                              <div className="bg-white rounded-md p-3 md:p-4 border-2 border-green-300">
                                <div className="text-xs text-gray-500 mb-1 md:mb-2">등록 선택</div>
                                <div className={`text-xl md:text-3xl font-bold mb-1 ${
                                  match.percentage2 >= 50 ? "text-green-600" : "text-gray-400"
                                }`}>
                                  {match.percentage2}%
                                </div>
                                <div className="text-xs md:text-sm text-gray-600">
                                  {match.chose2}명 / {match.total}명
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 각 대학별 학과 통계 */}
              {(displayComparison.majorStats.university1.length > 0 || displayComparison.majorStats.university2.length > 0) && (
                <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">각 학교별 학과 통계</h2>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">각 학교의 학과별 선택 통계를 확인하세요</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    {/* 왼쪽: 첫 번째 대학의 학과별 통계 */}
                    <div className="p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                        {displayComparison.university1}
                      </h3>
                      {displayComparison.majorStats.university1.length > 0 ? (
                        <div className="space-y-2 md:space-y-3">
                          {displayComparison.majorStats.university1.map((majorStat, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm md:text-base truncate">{majorStat.major}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {majorStat.total}명 합격 · {majorStat.chose}명 선택
                                </div>
                              </div>
                              <div className="text-right ml-3 md:ml-4">
                                <div className={`text-base md:text-lg font-bold ${
                                  majorStat.percentage >= 50 ? "text-green-600" : "text-gray-600"
                                }`}>
                                  {majorStat.percentage}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs md:text-sm text-gray-500">학과별 데이터가 없습니다</p>
                      )}
                    </div>

                    {/* 오른쪽: 두 번째 대학의 학과별 통계 */}
                    <div className="p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                        {displayComparison.university2}
                      </h3>
                      {displayComparison.majorStats.university2.length > 0 ? (
                        <div className="space-y-2 md:space-y-3">
                          {displayComparison.majorStats.university2.map((majorStat, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm md:text-base truncate">{majorStat.major}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {majorStat.total}명 합격 · {majorStat.chose}명 선택
                                </div>
                              </div>
                              <div className="text-right ml-3 md:ml-4">
                                <div className={`text-base md:text-lg font-bold ${
                                  majorStat.percentage >= 50 ? "text-red-600" : "text-gray-600"
                                }`}>
                                  {majorStat.percentage}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs md:text-sm text-gray-500">학과별 데이터가 없습니다</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 유사한 대학 비교 */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {displayComparison.university1}와 유사한 대학으로 교체:
              </h3>
              <ul className="space-y-2">
                {getSimilarUniversities(displayComparison.university1).map((uni, idx) => (
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
                {displayComparison.university2}와 유사한 대학으로 교체:
              </h3>
              <ul className="space-y-2">
                {getSimilarUniversities(displayComparison.university2).map((uni, idx) => (
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

          {/* 개별 제출 데이터 게시판 */}
          {submissions.length > 0 && (
            <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">제출 데이터</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">각 학생의 합격 및 등록 정보를 확인하세요</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {submissions.map((submission, idx) => {
                  const uni1Major = submission.admittedMajors?.[displayComparison.university1] || "";
                  const uni2Major = submission.admittedMajors?.[displayComparison.university2] || "";
                  const registeredMajor = submission.registeredMajor || "";
                  const isRegistered1 = submission.registeredUniversity === displayComparison.university1;
                  const isRegistered2 = submission.registeredUniversity === displayComparison.university2;
                  const date = new Date(submission.createdAt);
                  const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

                  return (
                    <div key={submission.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                        {/* 왼쪽 대학 */}
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <span className={`text-sm md:text-base font-bold ${
                            isRegistered1 ? "text-green-600" : "text-gray-400"
                          }`}>
                            {isRegistered1 ? "100%" : "0%"}
                          </span>
                          <span className="text-sm md:text-base font-medium text-gray-900 truncate">
                            {displayComparison.university1}
                            {uni1Major && <span className="text-gray-500 ml-1">({uni1Major})</span>}
                          </span>
                        </div>

                        {/* VS */}
                        <span className="text-xs md:text-sm text-gray-500 font-medium">vs</span>

                        {/* 오른쪽 대학 */}
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <span className="text-sm md:text-base font-medium text-gray-900 truncate">
                            {displayComparison.university2}
                            {uni2Major && <span className="text-gray-500 ml-1">({uni2Major})</span>}
                          </span>
                          <span className={`text-sm md:text-base font-bold ${
                            isRegistered2 ? "text-red-600" : "text-gray-400"
                          }`}>
                            {isRegistered2 ? "100%" : "0%"}
                          </span>
                          <span className="text-xs md:text-sm text-gray-500">(1명)</span>
                        </div>

                        {/* 등록 정보 (모바일에서만 표시) */}
                        <div className="w-full md:hidden pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            등록: <span className="font-medium text-gray-700">{submission.registeredUniversity}</span>
                            {registeredMajor && <span className="text-gray-500"> ({registeredMajor})</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{formattedDate}</div>
                        </div>

                        {/* 등록 정보 (데스크톱에서만 표시) */}
                        <div className="hidden md:flex items-center gap-3 text-xs text-gray-500">
                          <span>등록: <span className="font-medium text-gray-700">{submission.registeredUniversity}</span></span>
                          {registeredMajor && <span>({registeredMajor})</span>}
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 등록 버튼 */}
          <div className="mt-6 md:mt-8 text-center">
            <Link
              href="/crossadmit/register"
              className="inline-block px-6 md:px-8 py-2 md:py-3 text-sm md:text-base bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-colors"
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
