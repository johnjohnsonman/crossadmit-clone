"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdmissionRecord } from "@/lib/types";
import PopularAdmissions from "@/components/admission/PopularAdmissions";
import PopularForum from "@/components/admission/PopularForum";
import PopularCrossAdmit from "@/components/admission/PopularCrossAdmit";

export default function AdmissionsPage() {
  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    university: "",
    major: "",
    year: "",
    status: "",
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/admissions");
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    if (filters.university && !record.university.includes(filters.university)) {
      return false;
    }
    if (filters.major && !record.major.includes(filters.major)) {
      return false;
    }
    if (filters.year && record.year !== parseInt(filters.year)) {
      return false;
    }
    if (filters.status && record.status !== filters.status) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f3f0]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3f0]">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">합격DB</h1>
          <p className="text-gray-600">대학 합격자 정보를 확인하세요</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 필터 섹션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대학교
                  </label>
                  <input
                    type="text"
                    value={filters.university}
                    onChange={(e) =>
                      setFilters({ ...filters, university: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                    placeholder="대학교 검색"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전공
                  </label>
                  <input
                    type="text"
                    value={filters.major}
                    onChange={(e) =>
                      setFilters({ ...filters, major: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                    placeholder="전공 검색"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연도
                  </label>
                  <input
                    type="number"
                    value={filters.year}
                    onChange={(e) =>
                      setFilters({ ...filters, year: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                    placeholder="연도"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">전체</option>
                    <option value="합격">합격</option>
                    <option value="등록">등록</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 게시글 목록 */}
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">데이터가 없습니다.</p>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <Link
                    key={record.id}
                    href={`/admissions/${record.id}`}
                    className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start gap-6">
                      {/* 대학 정보 */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {record.university.charAt(0)}
                        </div>
                      </div>

                      {/* 메인 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">
                                {record.university}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  record.status === "합격"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {record.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {record.universityEn}
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {record.major}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{record.year}년도</div>
                            <div>{record.admissionType}</div>
                          </div>
                        </div>

                        {/* 정량적 스펙 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                          {/* 테스트 스코어 */}
                          <div>
                            <div className="text-xs text-gray-500 mb-1">테스트 스코어</div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.testScores ? (
                                <>
                                  {record.testScores.type}
                                  {record.testScores.score && ` ${record.testScores.score}`}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </div>

                          {/* 내신 */}
                          <div>
                            <div className="text-xs text-gray-500 mb-1">내신</div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.gpa ? (
                                <>
                                  {record.gpa.unweighted || record.gpa.weighted || "-"}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </div>

                          {/* 특기 */}
                          <div>
                            <div className="text-xs text-gray-500 mb-1">특기</div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.specialSkills && record.specialSkills.length > 0 ? (
                                <span className="line-clamp-1">
                                  {record.specialSkills[0]}
                                  {record.specialSkills.length > 1 && ` 외 ${record.specialSkills.length - 1}개`}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </div>

                          {/* 사용자 정보 */}
                          <div>
                            <div className="text-xs text-gray-500 mb-1">작성자</div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.username || "익명"}
                            </div>
                          </div>
                        </div>

                        {/* 하단 정보 */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>👍 {record.likes || 0}</span>
                            <span>💬 {record.comments?.length || 0}</span>
                            <span>👁 {Math.floor(Math.random() * 1000) + 100}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(record.createdAt).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            <PopularAdmissions />
            <PopularForum />
            <PopularCrossAdmit />
          </div>
        </div>
      </div>
    </main>
  );
}
