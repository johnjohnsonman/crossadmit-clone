"use client";

import { useState } from "react";

interface Props {
  universityName: string;
}

export default function UniversityGallery({ universityName }: Props) {
  // 실제로는 API에서 이미지 URL을 가져와야 함
  const images = [
    {
      id: "1",
      url: "https://via.placeholder.com/400x300?text=Campus+1",
      title: "정문",
    },
    {
      id: "2",
      url: "https://via.placeholder.com/400x300?text=Campus+2",
      title: "중앙도서관",
    },
    {
      id: "3",
      url: "https://via.placeholder.com/400x300?text=Campus+3",
      title: "강의동",
    },
    {
      id: "4",
      url: "https://via.placeholder.com/400x300?text=Campus+4",
      title: "학생회관",
    },
  ];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
      <h2 className="text-2xl font-serif text-sage-800 mb-4">학교 사진</h2>
      <div className="grid grid-cols-2 gap-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative aspect-video cursor-pointer overflow-hidden rounded-lg border border-sage-200 hover:border-tea-300 transition-all"
            onClick={() => setSelectedImage(image.url)}
          >
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
              {image.title}
            </div>
          </div>
        ))}
      </div>

      {/* 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="확대 이미지"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}


