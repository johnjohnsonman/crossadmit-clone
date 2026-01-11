"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

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

function getNewsArticle(universityId: string, articleId: string) {
  const articleIdNum = parseInt(articleId.split('-').pop() || '1');
  return {
    id: articleId,
    title: `${UNIVERSITY_INFO[universityId]?.name || "대학"} 관련 뉴스 제목 ${articleIdNum}`,
    summary: `이것은 뉴스 기사의 요약 내용입니다. ${articleIdNum}번째 기사로, 대학의 최신 소식과 정보를 제공합니다.`,
    content: `이것은 뉴스 기사의 전체 내용입니다. ${articleIdNum}번째 기사로, 대학의 최신 소식과 정보를 상세히 제공합니다.

대학의 다양한 활동과 성과에 대해 자세히 다룹니다. 학생들의 연구 성과, 교수진의 업적, 캠퍼스의 새로운 변화 등 다양한 주제를 포함합니다.

이 기사는 대학 커뮤니티에 중요한 정보를 전달하며, 학생들과 졸업생들에게 유용한 정보를 제공합니다.`,
    author: `Reporter ${articleIdNum}`,
    date: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    category: "입학",
    image: `https://picsum.photos/1200/600?random=${articleIdNum}&seed=${universityId}`,
    views: Math.floor(Math.random() * 5000) + 100,
  };
}

export default function NewsDetailPage() {
  const params = useParams();
  const universityId = params.university as string;
  const articleId = params.id as string;
  const university = UNIVERSITY_INFO[universityId];
  const article = getNewsArticle(universityId, articleId);

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
    <main className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <Link href={`/forum/${universityId}/news`} className="text-sm text-gray-500 hover:text-gray-700">
              ← 뉴스 목록
            </Link>
          </div>
        </div>
      </div>

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 헤드라인 */}
        <header className="mb-12">
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {article.category}
            </span>
          </div>
          <h1 className="text-5xl font-serif text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-gray-600 border-b border-gray-200 pb-6">
            <div>
              <div className="font-medium">{article.author}</div>
              <div className="text-sm">{article.date}</div>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <span>👁 {article.views.toLocaleString()} views</span>
            </div>
          </div>
        </header>

        {/* 메인 이미지 */}
        {article.image && (
          <div className="mb-12">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-auto"
            />
            <p className="text-sm text-gray-500 mt-2 italic">
              {article.title} 관련 이미지
            </p>
          </div>
        )}

        {/* 본문 */}
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed mb-8 font-serif">
            {article.summary}
          </p>
          <div className="text-gray-800 leading-relaxed space-y-6 text-lg">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="leading-8">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Link
              href={`/forum/${universityId}/news`}
              className="text-blue-600 hover:underline"
            >
              ← 뉴스 목록으로 돌아가기
            </Link>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">
                공유하기
              </button>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">
                인쇄하기
              </button>
            </div>
          </div>
        </footer>
      </article>
    </main>
  );
}
