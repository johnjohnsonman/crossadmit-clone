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

// 갤러리 아이템 데이터 (실제로는 API에서 가져와야 함)
function getGalleryItem(universityId: string, itemId: string) {
  const itemIdNum = parseInt(itemId.split('-').pop() || '1');
  return {
    id: itemId,
    title: `캠퍼스 사진 ${itemIdNum}`,
    author: `user${itemIdNum}`,
    date: new Date().toLocaleDateString('ko-KR'),
    views: Math.floor(Math.random() * 1000) + 100,
    likes: Math.floor(Math.random() * 50) + 5,
    images: [
      `https://picsum.photos/1600/1200?random=${itemIdNum * 3}&seed=${universityId}`,
      `https://picsum.photos/1600/1200?random=${itemIdNum * 3 + 1}&seed=${universityId}`,
      `https://picsum.photos/1600/1200?random=${itemIdNum * 3 + 2}&seed=${universityId}`,
      `https://picsum.photos/1600/1200?random=${itemIdNum * 3 + 3}&seed=${universityId}`,
      `https://picsum.photos/1600/1200?random=${itemIdNum * 3 + 4}&seed=${universityId}`,
    ],
    description: "캠퍼스의 아름다운 풍경을 담았습니다. 학교 생활의 소중한 순간들을 공유합니다.",
  };
}

export default function GalleryDetailPage() {
  const params = useParams();
  const universityId = params.university as string;
  const itemId = params.id as string;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const university = UNIVERSITY_INFO[universityId];
  const item = getGalleryItem(universityId, itemId);

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

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : item.images.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev < item.images.length - 1 ? prev + 1 : 0));
  };

  return (
    <main className="min-h-screen bg-black">
      {/* 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/forum/${universityId}/gallery`}
                className="text-white hover:text-gray-300 text-sm mb-1 inline-block"
              >
                ← 갤러리로 돌아가기
              </Link>
              <h1 className="text-white font-semibold">{item.title}</h1>
            </div>
            <div className="flex items-center gap-4 text-white text-sm">
              <span>👁 {item.views}</span>
              <span>❤ {item.likes}</span>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30"
              >
                {isFullscreen ? "나가기" : "전체화면"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 이미지 */}
      <div className="relative min-h-screen flex items-center justify-center pt-20 pb-8">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="relative">
            {/* 이미지 */}
            <div className="relative aspect-[4/3] max-h-[85vh] overflow-hidden rounded-lg bg-gray-900">
              <img
                src={item.images[selectedImageIndex]}
                alt={`${item.title} - ${selectedImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 이전/다음 버튼 */}
            {item.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* 이미지 인디케이터 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {item.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedImageIndex ? "bg-white w-8" : "bg-white bg-opacity-50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 이미지 썸네일 목록 */}
          <div className="mt-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {item.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex
                      ? "border-white scale-110"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 정보 섹션 */}
      <div className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{item.author}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium">
                  ❤ 좋아요 {item.likes}
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium">
                  💬 댓글
                </button>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">{item.description}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
