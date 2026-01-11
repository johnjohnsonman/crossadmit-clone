"use client";

import Link from "next/link";

interface ConnectingProfile {
  id: string;
  name: string;
  university: string;
  major: string;
  additionalInfo?: string;
  description: string;
  tags: string[];
}

export default function Connecting() {
  const profiles: ConnectingProfile[] = [
    {
      id: "1",
      name: "EPIC",
      university: "Northwestern University",
      major: "Kellogg MBA",
      additionalInfo: "외 8개",
      description: "Haas, Kellogg, Sloan 등 Top MBA에서 어드미션을 받았으며 21년 가을...",
      tags: ["지원 전략 조언", "학교 소개", "학습 방법 조언"],
    },
    {
      id: "2",
      name: "이채윤",
      university: "서울대학교",
      major: "경제학부",
      description: "대치동에서 자기소개서 및 면접에 대한 구체적인 상담 진행하고 있습니다....",
      tags: ["면접 조언", "입시 정보 조언", "지원 전략 조언"],
    },
    {
      id: "3",
      name: "고려대국어국문",
      university: "고려대학교(서울캠)",
      major: "국어국문학과",
      additionalInfo: "외 4개",
      description: "고려대학교 국어국문학과 20학번 (학교추천 2 전형, 최초합) 성균관대...",
      tags: ["입시 자료 공유", "입시 정보 조언", "지원 전략 조언"],
    },
    {
      id: "4",
      name: "박현수",
      university: "서울대학교",
      major: "의예과",
      additionalInfo: "외 3개",
      description: "서울대학교 의과대학 의예과 21학번으로 진학하게 될 박현수라고 합니다~",
      tags: ["입시 정보 조언", "학교 소개", "학습 방법 조언"],
    },
    {
      id: "5",
      name: "cowman",
      university: "USC",
      major: "MBA",
      additionalInfo: "외 4개",
      description: "안녕하세요. 미국 유학 후 사업하고 있습니다. 미국 유학 관련 전반...",
      tags: ["입시 자료 공유", "자료 공유 (자기소개서/프리젠테이션 등)", "진로 조언"],
    },
  ];

  return (
    <section className="py-12 bg-sage-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-sage-800">커넥팅</h2>
          <Link href="/connecting" className="text-tea-600 hover:text-tea-700 text-sm">
            more &gt;
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-lg p-6 border border-sage-200 hover:shadow-md transition-all"
            >
              <div className="mb-4">
                <h3 className="text-lg font-medium text-sage-900 mb-1">
                  {profile.name}
                </h3>
                <p className="text-sm text-sage-700">
                  {profile.university} {profile.major}
                  {profile.additionalInfo && (
                    <span className="text-sage-500"> {profile.additionalInfo}</span>
                  )}
                </p>
              </div>
              <p className="text-sm text-sage-600 mb-4 line-clamp-2">
                {profile.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-tea-50 text-tea-700 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


