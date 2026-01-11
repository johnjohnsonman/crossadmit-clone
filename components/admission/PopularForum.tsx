"use client";

import Link from "next/link";
import { ForumPost } from "@/lib/types";

export default function PopularForum() {
  // 실제로는 API에서 가져와야 함
  const posts: ForumPost[] = [
    {
      id: "1",
      university: "[서울대학교]",
      title: "2020 공인회계사 CPA 합격수기 (2)",
      category: "학교 소식 / 정보",
      views: 1279,
      likes: 4,
      date: "20.12.29",
    },
    {
      id: "2",
      university: "[Cornell University]",
      title: "Wayfair Co-Founder in Conversation with Fiona Tan...",
      category: "학교 소식 / 정보",
      views: 1820,
      likes: 2,
      date: "21.02.08",
    },
    {
      id: "3",
      university: "[Harvard University]",
      title: "Harvard Business School Decision REACTION",
      category: "자유",
      views: 1534,
      likes: 5,
      date: "21.04.02",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">인기 포럼</h3>
        <Link href="/forum" className="text-sm text-blue-600 hover:text-blue-700">
          more &gt;
        </Link>
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/forum/${post.id}`}
            className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
          >
            <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
              {post.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>조회 {post.views.toLocaleString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


