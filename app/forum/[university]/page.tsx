"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const UNIVERSITY_INFO: Record<string, { name: string; nameEn: string; type: string; location: string }> = {
  "seoul-national": { name: "서울대학교", nameEn: "Seoul National University", type: "국립", location: "서울" },
  "yonsei": { name: "연세대학교(서울캠)", nameEn: "Yonsei University", type: "사립", location: "서울" },
  "korea": { name: "고려대학교(서울캠)", nameEn: "Korea University", type: "사립", location: "서울" },
  "sungkunkwan": { name: "성균관대학교", nameEn: "Sungkyunkwan University", type: "사립", location: "서울" },
  "chungang": { name: "중앙대학교", nameEn: "Chung-Ang University", type: "사립", location: "서울" },
  "hanyang": { name: "한양대학교", nameEn: "Hanyang University", type: "사립", location: "서울" },
  "seoul-city": { name: "서울시립대학교", nameEn: "University of Seoul", type: "국립", location: "서울" },
  "konkuk": { name: "건국대학교(서울캠)", nameEn: "Konkuk University", type: "사립", location: "서울" },
  "hongik": { name: "홍익대학교", nameEn: "Hongik University", type: "사립", location: "서울" },
  "kyunghee": { name: "경희대학교(서울캠)", nameEn: "Kyung Hee University", type: "사립", location: "서울" },
  "ewha": { name: "이화여자대학교", nameEn: "Ewha Womans University", type: "사립", location: "서울" },
  "dongguk": { name: "동국대학교(서울캠)", nameEn: "Dongguk University", type: "사립", location: "서울" },
  "pusan": { name: "부산대학교", nameEn: "Pusan National University", type: "국립", location: "부산" },
  "stanford": { name: "Stanford University", nameEn: "Stanford University", type: "외국", location: "미국" },
  "harvard": { name: "Harvard University", nameEn: "Harvard University", type: "외국", location: "미국" },
  "mit": { name: "MIT", nameEn: "Massachusetts Institute of Technology", type: "외국", location: "미국" },
  "berkeley": { name: "UC Berkeley", nameEn: "University of California, Berkeley", type: "외국", location: "미국" },
  "ucla": { name: "UCLA", nameEn: "University of California, Los Angeles", type: "외국", location: "미국" },
  "columbia": { name: "Columbia University", nameEn: "Columbia University", type: "외국", location: "미국" },
};

type TabType = "gallery" | "news" | "free";

export default function UniversityForumPage() {
  const params = useParams();
  const universityId = params.university as string;
  const [activeTab, setActiveTab] = useState<TabType>("gallery");

  const university = UNIVERSITY_INFO[universityId];

  if (!university) {
    return (
      <main className="min-h-screen bg-[#f5f3f0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">대학을 찾을 수 없습니다</h1>
          <Link href="/forum" className="text-blue-600 hover:underline">게시판 목록으로 돌아가기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3f0]">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <Link href="/forum" className="text-sm text-gray-500 hover:text-gray-700">
              ← 게시판 목록
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{university.name}</h1>
          <p className="text-gray-600">{university.nameEn}</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("gallery")}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === "gallery"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              학교 갤러리
            </button>
            <button
              onClick={() => setActiveTab("news")}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === "news"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              뉴스
            </button>
            <button
              onClick={() => setActiveTab("free")}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === "free"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              자유게시판
            </button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "gallery" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">학교 갤러리</h2>
              <Link
                href={`/forum/${universityId}/gallery`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600 mb-4">학교 갤러리에서 캠퍼스 사진을 확인하세요</p>
              <Link
                href={`/forum/${universityId}/gallery`}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                갤러리 보기 →
              </Link>
            </div>
          </div>
        )}

        {activeTab === "news" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">뉴스</h2>
              <Link
                href={`/forum/${universityId}/news`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600 mb-4">최신 뉴스와 소식을 확인하세요</p>
              <Link
                href={`/forum/${universityId}/news`}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                뉴스 보기 →
              </Link>
            </div>
          </div>
        )}

        {activeTab === "free" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">자유게시판</h2>
              <Link
                href={`/forum/${universityId}/free`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600 mb-4">학생들의 자유로운 소통 공간</p>
              <Link
                href={`/forum/${universityId}/free`}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                게시판 보기 →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
