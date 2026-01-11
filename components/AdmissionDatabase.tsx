"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdmissionRecord } from "@/lib/types";

export default function AdmissionDatabase() {
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
      <div className="text-center py-12">
        <p className="text-sage-600">데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-sage-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              대학교
            </label>
            <input
              type="text"
              value={filters.university}
              onChange={(e) =>
                setFilters({ ...filters, university: e.target.value })
              }
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tea-500 text-sage-900 placeholder:text-sage-400"
              placeholder="대학교 검색"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              전공
            </label>
            <input
              type="text"
              value={filters.major}
              onChange={(e) =>
                setFilters({ ...filters, major: e.target.value })
              }
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tea-500 text-sage-900 placeholder:text-sage-400"
              placeholder="전공 검색"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              연도
            </label>
            <input
              type="number"
              value={filters.year}
              onChange={(e) =>
                setFilters({ ...filters, year: e.target.value })
              }
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tea-500 text-sage-900 placeholder:text-sage-400"
              placeholder="연도"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              상태
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tea-500 text-sage-900 bg-white"
            >
              <option value="">전체</option>
              <option value="합격">합격</option>
              <option value="등록">등록</option>
            </select>
          </div>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-sage-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-sage-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                  대학교
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                  전공
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                  연도
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                  전형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-sage-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sage-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-tea-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admissions/${record.id}`}
                        className="block hover:text-tea-600 transition-colors"
                      >
                        <div className="text-sm font-medium text-sage-900">
                          {record.university}
                        </div>
                        <div className="text-sm text-sage-500">
                          {record.universityEn}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-sage-700">
                      <Link
                        href={`/admissions/${record.id}`}
                        className="block hover:text-tea-600 transition-colors"
                      >
                        {record.major}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-sage-700">
                      <Link
                        href={`/admissions/${record.id}`}
                        className="block hover:text-tea-600 transition-colors"
                      >
                        {record.year}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-sage-700">
                      <Link
                        href={`/admissions/${record.id}`}
                        className="block hover:text-tea-600 transition-colors"
                      >
                        {record.admissionType}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admissions/${record.id}`}
                        className="block"
                      >
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.status === "합격"
                              ? "bg-tea-100 text-tea-800"
                              : "bg-sage-100 text-sage-800"
                          }`}
                        >
                          {record.status}
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-sm text-sage-600">
        총 {filteredRecords.length}개의 합격자 정보
      </div>
    </div>
  );
}

