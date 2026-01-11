"use client";

import Link from "next/link";

interface ForumPost {
  id: string;
  university: string;
  title: string;
  category: string;
  views: number;
  likes: number;
  date: string;
}

export default function PopularForum() {
  const posts: ForumPost[] = [
    {
      id: "1",
      university: "[중앙대학교]",
      title: "2020 공인회계사 CPA 대학순위 (2)",
      category: "학교 소식 / 정보",
      views: 1279,
      likes: 4,
      date: "20.12.29",
    },
    {
      id: "2",
      university: "[경희대학교(서울캠)]",
      title: "(EN) 지훈이가 춤은 되는데, 패션은 아예 모르네 ^^ㅣ05학번이즈백 (feat.피식대학) l 시...",
      category: "유명 동문",
      views: 2631,
      likes: 9,
      date: "21.04.27",
    },
    {
      id: "3",
      university: "[중앙대학교]",
      title: "[뉴스&이사람] 'AI 학과 신설' 중앙대학교 소프트웨어학부 홍성우 교수...",
      category: "입학 정보",
      views: 826,
      likes: 4,
      date: "21.04.14",
    },
    {
      id: "4",
      university: "[한양대학교]",
      title: "한양대 연영과 Q&A 연기전공 입시에 관한 모든것등급컷, 지정대사, 움직임, 연기학원뼝아리...",
      category: "학교 소식 / 정보",
      views: 930,
      likes: 4,
      date: "21.04.27",
    },
    {
      id: "5",
      university: "[Cornell University]",
      title: "Wayfair Co-Founder in Conversation with Fiona Tan, Global Head of Customer & Suppl...",
      category: "학교 소식 / 정보",
      views: 1820,
      likes: 2,
      date: "21.02.08",
    },
    {
      id: "6",
      university: "[중앙대학교]",
      title: "수시 5관왕의 비결은? 동주의 생기부 관리법 대공개!ㅣ 중앙대 광고홍보학과, 동국대 광고홍보...",
      category: "입학 정보",
      views: 1528,
      likes: 4,
      date: "21.05.18",
    },
    {
      id: "7",
      university: "[Harvard University]",
      title: "Harvard Business School Decision REACTION",
      category: "자유",
      views: 1534,
      likes: 5,
      date: "21.04.02",
    },
    {
      id: "8",
      university: "[한성대학교]",
      title: "[B대면데이트]#1. 첫번째 데이트 임플란티드키드/23/래퍼",
      category: "유명 동문",
      views: 1541,
      likes: 7,
      date: "21.04.28",
    },
    {
      id: "9",
      university: "[한양대학교]",
      title: "ep24. 문과 학과 선호도 1위는?! 한양대 경제금융 경영 파이낸스경영에게 물었다! [사자가...",
      category: "입학 정보",
      views: 1026,
      likes: 1,
      date: "21.03.10",
    },
    {
      id: "10",
      university: "[경희대학교(서울캠)]",
      title: "그 유명한 경희대학교 학식을 털어보았다! | 연고티비",
      category: "맛집/주변정보",
      views: 776,
      likes: 1,
      date: "21.03.29",
    },
  ];

  return (
    <section className="py-12 bg-sage-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-sage-800">인기 포럼</h2>
          <Link href="/forum" className="text-tea-600 hover:text-tea-700 text-sm">
            more &gt;
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-sage-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sage-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                  조회/추천
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider">
                  날짜
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-sage-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-tea-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/forum/${post.id}`} className="block">
                      <span className="text-sm font-medium text-tea-700">
                        {post.university}
                      </span>{" "}
                      <span className="text-sm text-sage-800">{post.title}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sage-600">
                    {post.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sage-600">
                    조회 {post.views.toLocaleString()} · 추천 {post.likes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sage-500">
                    {post.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


