"use client";

import { useState } from "react";
import Link from "next/link";
import { ALL_KOREAN_UNIVERSITIES } from "@/lib/koreanUniversities";
import { UNIQUE_MAJORS } from "@/lib/majors";

// 외국 대학 목록
const FOREIGN_UNIVERSITIES = [
  // 미국 대학
  "Stanford University",
  "Harvard University",
  "MIT",
  "UC Berkeley",
  "UCLA",
  "University of Southern California",
  "Columbia University",
  "Yale University",
  "Princeton University",
  "New York University",
  "University of Pennsylvania",
  "Cornell University",
  "University of Chicago",
  "Duke University",
  "Northwestern University",
  "Johns Hopkins University",
  "Carnegie Mellon University",
  "University of Michigan",
  "University of Virginia",
  "University of North Carolina",
  "University of California, San Diego",
  "University of California, Davis",
  "University of California, Irvine",
  "University of Washington",
  "University of Texas at Austin",
  "University of Wisconsin-Madison",
  "Boston University",
  "University of Illinois",
  "Purdue University",
  "Penn State University",
  "Ohio State University",
  "University of Georgia",
  "University of Florida",
  "University of Maryland",
  "Rutgers University",
  "University of California, Santa Barbara",
  "University of California, Santa Cruz",
  "University of California, Riverside",
  "Indiana University",
  "University of Minnesota",
  "Michigan State University",
  "Arizona State University",
  "University of Arizona",
  "University of Colorado",
  "University of Utah",
  "University of Oregon",
  "Oregon State University",
  "University of California, Merced",
  "University of California, San Francisco",
  
  // 영국 대학
  "University of Oxford",
  "University of Cambridge",
  "Imperial College London",
  "London School of Economics",
  "University College London",
  "King's College London",
  "University of Edinburgh",
  "University of Manchester",
  "University of Bristol",
  "University of Warwick",
  
  // 캐나다 대학
  "University of Toronto",
  "University of British Columbia",
  "McGill University",
  "University of Alberta",
  "McMaster University",
  "University of Waterloo",
  "Western University",
  "Queen's University",
  "University of Calgary",
  "Simon Fraser University",
  
  // 호주 대학
  "University of Melbourne",
  "Australian National University",
  "University of Sydney",
  "University of New South Wales",
  "University of Queensland",
  "Monash University",
  "University of Western Australia",
  "University of Adelaide",
  
  // 일본 대학
  "도쿄대학교",
  "교토대학교",
  "오사카대학교",
  "도호쿠대학교",
  "나고야대학교",
  "큐슈대학교",
  "홋카이도대학교",
  "와세다대학교",
  "게이오대학교",
  
  // 중국 대학
  "베이징대학교",
  "칭화대학교",
  "푸단대학교",
  "상하이교통대학교",
  "저장대학교",
  "난징대학교",
  "중국과학기술대학교",
  "시안교통대학교",
  "하얼빈공업대학교",
  
  // 기타 아시아 대학
  "싱가포르국립대학교",
  "난양공과대학교",
  "홍콩대학교",
  "홍콩중문대학교",
  "홍콩과기대학교",
  "국립타이완대학교",
  "국립청화대학교",
  "국립성공대학교",
];

const UNIVERSITIES = [
  ...ALL_KOREAN_UNIVERSITIES,
  ...FOREIGN_UNIVERSITIES,
];

export default function RegisterPage() {
  const [admittedUniversities, setAdmittedUniversities] = useState<string[]>([]);
  const [admittedMajors, setAdmittedMajors] = useState<Record<string, string>>({}); // 학교별 학과
  const [registeredUniversity, setRegisteredUniversity] = useState<string>("");
  const [registeredMajor, setRegisteredMajor] = useState<string>(""); // 등록한 학과
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [majorSearchTerm, setMajorSearchTerm] = useState<string>("");
  const [selectedUniversityForMajor, setSelectedUniversityForMajor] = useState<string>(""); // 학과 선택 중인 대학

  const handleAddUniversity = (university: string) => {
    if (!admittedUniversities.includes(university) && admittedUniversities.length < 10) {
      setAdmittedUniversities([...admittedUniversities, university]);
    }
  };

  const handleRemoveUniversity = (university: string) => {
    setAdmittedUniversities(admittedUniversities.filter((u) => u !== university));
    const newMajors = { ...admittedMajors };
    delete newMajors[university];
    setAdmittedMajors(newMajors);
    if (registeredUniversity === university) {
      setRegisteredUniversity("");
      setRegisteredMajor("");
    }
    if (selectedUniversityForMajor === university) {
      setSelectedUniversityForMajor("");
    }
  };

  const handleSetMajor = (university: string, major: string) => {
    setAdmittedMajors({
      ...admittedMajors,
      [university]: major,
    });
    setSelectedUniversityForMajor("");
    setMajorSearchTerm("");
  };

  const handleRemoveMajor = (university: string) => {
    const newMajors = { ...admittedMajors };
    delete newMajors[university];
    setAdmittedMajors(newMajors);
    if (registeredUniversity === university && registeredMajor === admittedMajors[university]) {
      setRegisteredMajor("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (admittedUniversities.length < 2) {
      alert("최소 2개 이상의 대학에 합격해야 합니다.");
      return;
    }

    if (!registeredUniversity) {
      alert("등록한 대학을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/crossadmit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admittedUniversities,
          registeredUniversity,
          admittedMajors: admittedMajors,
          registeredMajor: registeredMajor,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = "/crossadmit";
        }, 2000);
      } else {
        alert("등록에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-[#f5f3f0] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">등록 완료!</h2>
          <p className="text-gray-600 mb-6">
            크로스어드밋 통계에 반영되었습니다.
          </p>
          <p className="text-sm text-gray-500">잠시 후 메인 페이지로 이동합니다...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3f0]">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-6 md:mb-8">
            <Link
              href="/crossadmit"
              className="text-blue-600 hover:text-blue-700 text-xs md:text-sm mb-3 md:mb-4 inline-block"
            >
              ← 크로스어드밋으로 돌아가기
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              내 학교 등록 인증하기
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              어디 어디 합격했고 어디 등록했는지 간단하게 등록하세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
            {/* 합격한 대학들 */}
            <div className="mb-6 md:mb-8">
              <label className="block text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                1. 합격한 대학을 모두 선택하세요 (최소 2개)
              </label>
              
              {/* 선택된 대학들 */}
              {admittedUniversities.length > 0 && (
                <div className="mb-4 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap gap-2">
                    {admittedUniversities.map((uni) => (
                      <span
                        key={uni}
                        className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-full text-xs md:text-sm font-medium break-all"
                      >
                        <span className="max-w-[200px] md:max-w-none truncate">{uni}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUniversity(uni)}
                          className="hover:bg-blue-700 rounded-full p-0.5 flex-shrink-0"
                          aria-label="제거"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 대학 검색 및 선택 */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="대학명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm md:text-base"
                />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddUniversity(e.target.value);
                      e.target.value = "";
                      setSearchTerm("");
                    }
                  }}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm md:text-base"
                  size={searchTerm ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 6 : 8) : 1}
                >
                  <option value="">대학 선택하기...</option>
                  {UNIVERSITIES
                    .filter((u) => !admittedUniversities.includes(u))
                    .filter((u) => 
                      searchTerm === "" || 
                      u.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.includes(searchTerm)
                    )
                    .map((uni) => (
                      <option key={uni} value={uni}>
                        {uni}
                      </option>
                    ))}
                </select>
                {searchTerm && (
                  <p className="text-xs text-gray-500">
                    {UNIVERSITIES.filter((u) => 
                      !admittedUniversities.includes(u) &&
                      (u.toLowerCase().includes(searchTerm.toLowerCase()) || u.includes(searchTerm))
                    ).length}개 대학이 검색되었습니다
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {admittedUniversities.length}개 선택됨
              </p>
            </div>

            {/* 합격한 대학별 학과 선택 (선택사항) */}
            {admittedUniversities.length > 0 && (
              <div className="mb-6 md:mb-8">
                <label className="block text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                  2. 합격한 대학별 학과 선택 (선택사항)
                </label>
                <div className="space-y-3 md:space-y-4">
                  {admittedUniversities.map((uni) => (
                    <div key={uni} className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2 md:mb-3 flex-wrap gap-2">
                        <span className="font-medium text-gray-900 text-sm md:text-base break-words flex-1 min-w-0">{uni}</span>
                        {admittedMajors[uni] && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMajor(uni)}
                            className="text-xs text-red-600 hover:text-red-700 flex-shrink-0"
                          >
                            학과 제거
                          </button>
                        )}
                      </div>
                      {admittedMajors[uni] ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs md:text-sm font-medium break-all">
                            {admittedMajors[uni]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedUniversityForMajor(uni)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex-shrink-0"
                          >
                            변경
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedUniversityForMajor(uni)}
                          className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          + 학과 선택하기
                        </button>
                      )}
                      {selectedUniversityForMajor === uni && (
                        <div className="mt-3 space-y-2">
                          <input
                            type="text"
                            placeholder="학과명 검색..."
                            value={majorSearchTerm}
                            onChange={(e) => setMajorSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSetMajor(uni, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                            size={majorSearchTerm ? 6 : 1}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">학과 선택하기...</option>
                            {UNIQUE_MAJORS
                              .filter((m) => 
                                majorSearchTerm === "" || 
                                m.toLowerCase().includes(majorSearchTerm.toLowerCase()) ||
                                m.includes(majorSearchTerm)
                              )
                              .map((major) => (
                                <option key={major} value={major}>
                                  {major}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUniversityForMajor("");
                              setMajorSearchTerm("");
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 등록한 대학 */}
            <div className="mb-6 md:mb-8">
              <label className="block text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                3. 실제로 등록한 대학을 선택하세요
              </label>
              
              {admittedUniversities.length === 0 ? (
                <p className="text-gray-500 text-sm mb-4">
                  먼저 합격한 대학을 선택해주세요
                </p>
              ) : (
                <div className="space-y-2">
                  {admittedUniversities.map((uni) => (
                    <div key={uni} className="space-y-2">
                      <label
                        className={`flex items-start md:items-center p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          registeredUniversity === uni
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="registeredUniversity"
                          value={uni}
                          checked={registeredUniversity === uni}
                          onChange={(e) => {
                            setRegisteredUniversity(e.target.value);
                            // 등록한 대학의 학과가 있으면 자동 선택
                            if (admittedMajors[uni]) {
                              setRegisteredMajor(admittedMajors[uni]);
                            } else {
                              setRegisteredMajor("");
                            }
                          }}
                          className="mt-1 md:mt-0 mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5 text-yellow-500 focus:ring-yellow-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-base md:text-lg font-medium text-gray-900 break-words">{uni}</span>
                          {admittedMajors[uni] && (
                            <span className="ml-1 md:ml-2 text-xs md:text-sm text-gray-600 block md:inline">({admittedMajors[uni]})</span>
                          )}
                        </div>
                        {registeredUniversity === uni && (
                          <span className="ml-2 text-yellow-600 font-semibold text-sm md:text-base flex-shrink-0">✓ 선택됨</span>
                        )}
                      </label>
                      {registeredUniversity === uni && admittedMajors[uni] && (
                        <div className="ml-6 md:ml-12 mb-2">
                          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                            등록한 학과 (선택사항)
                          </label>
                          <select
                            value={registeredMajor}
                            onChange={(e) => setRegisteredMajor(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white text-xs md:text-sm"
                          >
                            <option value="">학과 선택 안함</option>
                            <option value={admittedMajors[uni]}>{admittedMajors[uni]}</option>
                            {UNIQUE_MAJORS
                              .filter((m) => m !== admittedMajors[uni])
                              .map((major) => (
                                <option key={major} value={major}>
                                  {major}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {admittedUniversities.length >= 2 && registeredUniversity ? (
                  <span className="text-green-600 font-medium">✓ 등록 가능</span>
                ) : (
                  <span>최소 2개 이상 합격하고 등록 대학을 선택해주세요</span>
                )}
              </div>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  admittedUniversities.length < 2 ||
                  !registeredUniversity
                }
                className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
                  isSubmitting ||
                  admittedUniversities.length < 2 ||
                  !registeredUniversity
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white shadow-md"
                }`}
              >
                {isSubmitting ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </form>

          {/* 안내 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>팁:</strong> 여러 대학에 합격한 경우 모두 선택하면 더 정확한 통계에 기여할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
