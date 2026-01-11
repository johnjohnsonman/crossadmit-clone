"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const UNIVERSITY_INFO: Record<string, { name: string; nameEn: string }> = {
  "seoul-national": { name: "서울대학교", nameEn: "Seoul National University" },
  "yonsei": { name: "연세대학교(서울캠)", nameEn: "Yonsei University" },
  "korea": { name: "고려대학교(서울캠)", nameEn: "Korea University" },
  "sungkunkwan": { name: "성균관대학교", nameEn: "Sungkyunkwan University" },
  "chungang": { name: "중앙대학교", nameEn: "Chung-Ang University" },
  "hanyang": { name: "한양대학교", nameEn: "Hanyang University" },
  "seoul-city": { name: "서울시립대학교", nameEn: "University of Seoul" },
  "konkuk": { name: "건국대학교(서울캠)", nameEn: "Konkuk University" },
  "hongik": { name: "홍익대학교", nameEn: "Hongik University" },
  "kyunghee": { name: "경희대학교(서울캠)", nameEn: "Kyung Hee University" },
  "ewha": { name: "이화여자대학교", nameEn: "Ewha Womans University" },
  "dongguk": { name: "동국대학교(서울캠)", nameEn: "Dongguk University" },
  "pusan": { name: "부산대학교", nameEn: "Pusan National University" },
  "stanford": { name: "Stanford University", nameEn: "Stanford University" },
  "harvard": { name: "Harvard University", nameEn: "Harvard University" },
  "mit": { name: "MIT", nameEn: "Massachusetts Institute of Technology" },
  "berkeley": { name: "UC Berkeley", nameEn: "University of California, Berkeley" },
  "ucla": { name: "UCLA", nameEn: "University of California, Los Angeles" },
  "columbia": { name: "Columbia University", nameEn: "Columbia University" },
};

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  isHot?: boolean;
  isNew?: boolean;
  category?: string;
}

function generatePosts(universityId: string): Post[] {
  const posts: Post[] = [];
  const categories = ["질문", "정보", "잡담", "후기", "공지"];
  
  for (let i = 1; i <= 30; i++) {
    posts.push({
      id: `${universityId}-post-${i}`,
      title: `게시글 제목 ${i} - ${UNIVERSITY_INFO[universityId]?.name || "대학"} 관련 내용입니다`,
      content: `이것은 게시글의 내용입니다. ${i}번째 게시글로, 자유롭게 의견을 나눌 수 있습니다.`,
      author: `user${i}`,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      views: Math.floor(Math.random() * 1000) + 50,
      likes: Math.floor(Math.random() * 100) + 1,
      comments: Math.floor(Math.random() * 50),
      isHot: i <= 3,
      isNew: i <= 5,
      category: categories[Math.floor(Math.random() * categories.length)],
    });
  }
  return posts;
}

export default function FreeBoardPage() {
  const params = useParams();
  const universityId = params.university as string;
  const [posts] = useState<Post[]>(() => generatePosts(universityId));
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "hot">("latest");
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

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "hot") {
      return (b.isHot ? 1000 : 0) + b.likes + b.comments - ((a.isHot ? 1000 : 0) + a.likes + a.comments);
    } else if (sortBy === "popular") {
      return b.views - a.views;
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  return (
    <main className="min-h-screen bg-[#f5f3f0]">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <Link href={`/forum/${universityId}`} className="text-sm text-gray-500 hover:text-gray-700">
              ← {university.name} 게시판
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">자유게시판</h1>
              <p className="text-gray-600">{university.name} 학생들의 자유로운 소통 공간</p>
            </div>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md">
              글쓰기
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 정렬 옵션 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">정렬:</span>
            <button
              onClick={() => setSortBy("latest")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "latest"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "popular"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              인기순
            </button>
            <button
              onClick={() => setSortBy("hot")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "hot"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🔥 핫게
            </button>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-3">
          {sortedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/forum/${universityId}/free/${post.id}`}
              className="block group"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isHot && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                          🔥 HOT
                        </span>
                      )}
                      {post.isNew && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          NEW
                        </span>
                      )}
                      {post.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {post.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="font-medium">{post.author}</span>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span>👁</span>
                        <span>{post.views}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>❤</span>
                        <span>{post.likes}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>💬</span>
                        <span>{post.comments}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === 1
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
