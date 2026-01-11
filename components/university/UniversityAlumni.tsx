"use client";

import { useState, useEffect } from "react";
import { FamousAlumni } from "@/lib/types";

interface Props {
  universityName: string;
}

export default function UniversityAlumni({ universityName }: Props) {
  const [alumni, setAlumni] = useState<FamousAlumni[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실제로는 API에서 가져와야 함
    const mockAlumni: FamousAlumni[] = [
      {
        id: "1",
        name: "홍길동",
        university: universityName,
        major: "경영학과",
        description: "대기업 CEO, 스타트업 창업가",
      },
      {
        id: "2",
        name: "김철수",
        university: universityName,
        major: "컴퓨터공학부",
        description: "IT 기업 CTO, 기술 혁신가",
      },
      {
        id: "3",
        name: "이영희",
        university: universityName,
        major: "의과대학",
        description: "명의, 의학 연구자",
      },
    ];
    setAlumni(mockAlumni);
    setLoading(false);
  }, [universityName]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
        <h2 className="text-2xl font-serif text-sage-800 mb-4">유명 동문</h2>
        <p className="text-sage-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
      <h2 className="text-2xl font-serif text-sage-800 mb-4">유명 동문</h2>
      <div className="space-y-4">
        {alumni.map((person) => (
          <div
            key={person.id}
            className="p-4 border border-sage-200 rounded-lg hover:bg-tea-50 transition-colors"
          >
            <h3 className="font-medium text-sage-900 mb-1">{person.name}</h3>
            {person.major && (
              <p className="text-sm text-sage-600 mb-2">{person.major}</p>
            )}
            <p className="text-sm text-sage-700">{person.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


