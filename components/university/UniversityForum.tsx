"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ForumPost } from "@/lib/types";

interface Props {
  universityName: string;
}

export default function UniversityForum({ universityName }: Props) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실제로는 API에서 가져와야 함
    const mockPosts: ForumPost[] = [
      {
        id: "1",
        university: `[${universityName}]`,
        title: `${universityName} 입시 정보 및 합격 후기`,
        category: "입학 정보",
        views: 1528,
        likes: 4,
        date: "21.05.18",
      },
      {
        id: "2",
        university: `[${universityName}]`,
        title: `${universityName} 학과별 등급컷 정리`,
        category: "입학 정보",
        views: 2237,
        likes: 3,
        date: "21.09.26",
      },
      {
        id: "3",
        university: `[${universityName}]`,
        title: `${universityName} 캠퍼스 투어 후기`,
        category: "학교 소식 / 정보",
        views: 930,
        likes: 4,
        date: "21.04.27",
      },
    ];
    setPosts(mockPosts);
    setLoading(false);
  }, [universityName]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
        <h2 className="text-2xl font-serif text-sage-800 mb-4">게시판</h2>
        <p className="text-sage-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-serif text-sage-800">게시판</h2>
        <Link
          href={`/forum?university=${encodeURIComponent(universityName)}`}
          className="text-sm text-tea-600 hover:text-tea-700"
        >
          더보기 &gt;
        </Link>
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/forum/${post.id}`}
            className="block p-4 border border-sage-200 rounded-lg hover:bg-tea-50 hover:border-tea-300 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-sage-900 mb-1">
                  {post.title}
                </h3>
                <div className="flex items-center space-x-3 text-xs text-sage-500">
                  <span>{post.category}</span>
                  <span>•</span>
                  <span>조회 {post.views.toLocaleString()}</span>
                  <span>•</span>
                  <span>추천 {post.likes}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


