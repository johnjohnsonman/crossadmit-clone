"use client";

import Link from "next/link";

export default function PopularCrossAdmit() {
  const items = [
    {
      id: "1",
      title: "광주과학기술원(GIST) 서울시립대학교",
      views: 1234,
    },
    {
      id: "2",
      title: "광주과학기술원(GIST) 중앙대학교",
      views: 987,
    },
    {
      id: "3",
      title: "이화여자대학교 숙명여자대학교",
      views: 856,
    },
    {
      id: "4",
      title: "이화여자대학교 세종대학교",
      views: 756,
    },
    {
      id: "5",
      title: "부경대학교 한국외국어대학교(글로벌캠)",
      views: 645,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">인기 크로스어드밋</h3>
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
          more &gt;
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/crossadmit/${item.id}`}
            className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
          >
            <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
              {item.title}
            </h4>
            <p className="text-xs text-gray-500 mt-1">조회 {item.views.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}


