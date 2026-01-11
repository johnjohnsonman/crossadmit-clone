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

interface GalleryItem {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  images: string[];
}

// 샘플 이미지 URL 생성 (실제로는 API에서 가져와야 함)
function generateGalleryItems(universityId: string): GalleryItem[] {
  const items: GalleryItem[] = [];
  for (let i = 1; i <= 20; i++) {
    items.push({
      id: `${universityId}-gallery-${i}`,
      title: `캠퍼스 사진 ${i}`,
      thumbnail: `https://picsum.photos/400/300?random=${i}&seed=${universityId}`,
      author: `user${i}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR'),
      views: Math.floor(Math.random() * 1000) + 100,
      likes: Math.floor(Math.random() * 50) + 5,
      images: [
        `https://picsum.photos/1200/800?random=${i * 3}&seed=${universityId}`,
        `https://picsum.photos/1200/800?random=${i * 3 + 1}&seed=${universityId}`,
        `https://picsum.photos/1200/800?random=${i * 3 + 2}&seed=${universityId}`,
      ],
    });
  }
  return items;
}

export default function GalleryPage() {
  const params = useParams();
  const universityId = params.university as string;
  const [galleryItems] = useState<GalleryItem[]>(() => generateGalleryItems(universityId));
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
            <Link href={`/forum/${universityId}`} className="text-sm text-gray-500 hover:text-gray-700">
              ← {university.name} 게시판
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{university.name} 갤러리</h1>
          <p className="text-gray-600">캠퍼스 사진과 학교 생활을 공유하세요</p>
        </div>
      </div>

      {/* 갤러리 그리드 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryItems.map((item) => (
            <Link
              key={item.id}
              href={`/forum/${universityId}/gallery/${item.id}`}
              className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{item.title}</h3>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{item.author}</span>
                  <div className="flex items-center gap-2">
                    <span>👁 {item.views}</span>
                    <span>❤ {item.likes}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">{item.date}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
