"use client";

import Link from "next/link";
import { useState } from "react";

interface University {
  id: string;
  name: string;
  nameEn: string;
  type: "국립" | "사립" | "외국";
  location: string;
  postCount: number;
  memberCount: number;
}

const UNIVERSITIES: University[] = [
  { id: "seoul-national", name: "서울대학교", nameEn: "Seoul National University", type: "국립", location: "서울", postCount: 1234, memberCount: 5678 },
  { id: "yonsei", name: "연세대학교(서울캠)", nameEn: "Yonsei University", type: "사립", location: "서울", postCount: 987, memberCount: 4321 },
  { id: "korea", name: "고려대학교(서울캠)", nameEn: "Korea University", type: "사립", location: "서울", postCount: 856, memberCount: 3890 },
  { id: "sungkunkwan", name: "성균관대학교", nameEn: "Sungkyunkwan University", type: "사립", location: "서울", postCount: 654, memberCount: 3210 },
  { id: "chungang", name: "중앙대학교", nameEn: "Chung-Ang University", type: "사립", location: "서울", postCount: 543, memberCount: 2890 },
  { id: "hanyang", name: "한양대학교", nameEn: "Hanyang University", type: "사립", location: "서울", postCount: 432, memberCount: 2456 },
  { id: "seoul-city", name: "서울시립대학교", nameEn: "University of Seoul", type: "국립", location: "서울", postCount: 321, memberCount: 1987 },
  { id: "konkuk", name: "건국대학교(서울캠)", nameEn: "Konkuk University", type: "사립", location: "서울", postCount: 298, memberCount: 1765 },
  { id: "hongik", name: "홍익대학교", nameEn: "Hongik University", type: "사립", location: "서울", postCount: 267, memberCount: 1543 },
  { id: "kyunghee", name: "경희대학교(서울캠)", nameEn: "Kyung Hee University", type: "사립", location: "서울", postCount: 245, memberCount: 1432 },
  { id: "ewha", name: "이화여자대학교", nameEn: "Ewha Womans University", type: "사립", location: "서울", postCount: 234, memberCount: 1321 },
  { id: "dongguk", name: "동국대학교(서울캠)", nameEn: "Dongguk University", type: "사립", location: "서울", postCount: 223, memberCount: 1210 },
  { id: "pusan", name: "부산대학교", nameEn: "Pusan National University", type: "국립", location: "부산", postCount: 212, memberCount: 1098 },
  { id: "stanford", name: "Stanford University", nameEn: "Stanford University", type: "외국", location: "미국", postCount: 189, memberCount: 987 },
  { id: "harvard", name: "Harvard University", nameEn: "Harvard University", type: "외국", location: "미국", postCount: 178, memberCount: 876 },
  { id: "mit", name: "MIT", nameEn: "Massachusetts Institute of Technology", type: "외국", location: "미국", postCount: 167, memberCount: 765 },
  { id: "berkeley", name: "UC Berkeley", nameEn: "University of California, Berkeley", type: "외국", location: "미국", postCount: 156, memberCount: 654 },
  { id: "ucla", name: "UCLA", nameEn: "University of California, Los Angeles", type: "외국", location: "미국", postCount: 145, memberCount: 543 },
  { id: "columbia", name: "Columbia University", nameEn: "Columbia University", type: "외국", location: "미국", postCount: 134, memberCount: 432 },
];

export default function ForumPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "국립" | "사립" | "외국">("all");

  const filteredUniversities = UNIVERSITIES.filter((uni) => {
    const matchesSearch = 
      uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || uni.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <main className="min-h-screen bg-[#f5f3f0]">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대학 게시판</h1>
          <p className="text-gray-600">각 대학의 갤러리, 뉴스, 자유게시판을 확인하세요</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="대학명 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterType("국립")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === "국립"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                국립
              </button>
              <button
                onClick={() => setFilterType("사립")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === "사립"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                사립
              </button>
              <button
                onClick={() => setFilterType("외국")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === "외국"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                외국
              </button>
            </div>
          </div>
        </div>

        {/* 대학 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-5">대학명</div>
              <div className="col-span-2">구분</div>
              <div className="col-span-2">위치</div>
              <div className="col-span-1 text-center">게시글</div>
              <div className="col-span-1 text-center">회원</div>
              <div className="col-span-1 text-center">상태</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredUniversities.map((uni) => (
              <Link
                key={uni.id}
                href={`/forum/${uni.id}`}
                className="block hover:bg-blue-50 transition-colors"
              >
                <div className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <div className="font-semibold text-gray-900">{uni.name}</div>
                      <div className="text-sm text-gray-500">{uni.nameEn}</div>
                    </div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        uni.type === "국립" ? "bg-green-100 text-green-800" :
                        uni.type === "사립" ? "bg-blue-100 text-blue-800" :
                        "bg-purple-100 text-purple-800"
                      }`}>
                        {uni.type}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">{uni.location}</div>
                    <div className="col-span-1 text-center text-sm text-gray-600">{uni.postCount.toLocaleString()}</div>
                    <div className="col-span-1 text-center text-sm text-gray-600">{uni.memberCount.toLocaleString()}</div>
                    <div className="col-span-1 text-center">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {filteredUniversities.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </main>
  );
}
