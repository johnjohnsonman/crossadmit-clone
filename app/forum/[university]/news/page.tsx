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

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image?: string;
  views: number;
}

function generateNewsArticles(universityId: string): NewsArticle[] {
  const categories = ["입학", "연구", "캠퍼스", "학생활동", "졸업생"];
  const articles: NewsArticle[] = [];

  for (let i = 1; i <= 15; i++) {
    articles.push({
      id: `${universityId}-news-${i}`,
      title: `${UNIVERSITY_INFO[universityId]?.name || "대학"} 관련 뉴스 제목 ${i}`,
      summary: `이것은 뉴스 기사의 요약 내용입니다. ${i}번째 기사로, 대학의 최신 소식과 정보를 제공합니다.`,
      content: `이것은 뉴스 기사의 전체 내용입니다. ${i}번째 기사로, 대학의 최신 소식과 정보를 상세히 제공합니다.`,
      author: `Reporter ${i}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      category: categories[Math.floor(Math.random() * categories.length)],
      image: i % 3 === 0 ? `https://picsum.photos/800/500?random=${i}&seed=${universityId}` : undefined,
      views: Math.floor(Math.random() * 5000) + 100,
    });
  }
  return articles;
}

export default function NewsPage() {
  const params = useParams();
  const universityId = params.university as string;
  const [articles] = useState<NewsArticle[]>(() => generateNewsArticles(universityId));
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

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  return (
    <main className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <Link href={`/forum/${universityId}`} className="text-sm text-gray-500 hover:text-gray-700">
              ← {university.name} 게시판
            </Link>
          </div>
          <h1 className="text-4xl font-serif text-gray-900 mb-2">{university.name} 뉴스</h1>
          <p className="text-gray-600 text-lg">{university.nameEn}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* 메인 피처 기사 (뉴욕타임즈 스타일) */}
        {featuredArticle && (
          <article className="mb-16 pb-16 border-b border-gray-300">
            <Link href={`/forum/${universityId}/news/${featuredArticle.id}`}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {featuredArticle.image && (
                    <div className="mb-6">
                      <img
                        src={featuredArticle.image}
                        alt={featuredArticle.title}
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  <h2 className="text-4xl font-serif text-gray-900 mb-4 leading-tight">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-xl text-gray-700 leading-relaxed mb-6">
                    {featuredArticle.summary}
                  </p>
                </div>
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <div className="text-sm text-gray-500 mb-4">
                      <div>{featuredArticle.author}</div>
                      <div>{featuredArticle.date}</div>
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{featuredArticle.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        )}

        {/* 다른 기사들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherArticles.map((article) => (
            <Link
              key={article.id}
              href={`/forum/${universityId}/news/${article.id}`}
              className="group"
            >
              <article className="h-full border-b border-gray-200 pb-6 hover:opacity-80 transition-opacity">
                {article.image && (
                  <div className="mb-4 aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {article.category}
                  </span>
                </div>
                <h3 className="text-xl font-serif text-gray-900 mb-3 leading-tight group-hover:underline">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                  {article.summary}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{article.author}</span>
                  <span>{article.date}</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
