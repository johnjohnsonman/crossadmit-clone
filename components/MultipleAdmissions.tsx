"use client";

import Link from "next/link";

interface MultipleAdmission {
  id: string;
  university1: string;
  university2: string;
  count1: number;
  count2: number;
  percentage1: number;
  percentage2: number;
}

export default function MultipleAdmissions() {
  const data: MultipleAdmission[] = [
    {
      id: "1",
      university1: "성균관대학교",
      university2: "중앙대학교",
      count1: 11,
      count2: 1,
      percentage1: 92,
      percentage2: 8,
    },
    {
      id: "2",
      university1: "고려대학교(서울캠)",
      university2: "중앙대학교",
      count1: 10,
      count2: 0,
      percentage1: 100,
      percentage2: 0,
    },
    {
      id: "3",
      university1: "고려대학교(서울캠)",
      university2: "성균관대학교",
      count1: 10,
      count2: 0,
      percentage1: 100,
      percentage2: 0,
    },
    {
      id: "4",
      university1: "연세대학교(서울캠)",
      university2: "성균관대학교",
      count1: 8,
      count2: 2,
      percentage1: 80,
      percentage2: 20,
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-sage-800">
            크로스어드밋 복수 합격자의 대학 선택 정보
          </h2>
          <Link href="/multiple-admissions" className="text-tea-600 hover:text-tea-700 text-sm">
            more &gt;
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.map((item) => (
            <div
              key={item.id}
              className="bg-sage-50 rounded-lg p-6 border border-sage-200 hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-sage-800">
                      {item.university1}
                    </span>
                    <span className="text-sm text-sage-600">
                      {item.count1}명 선택
                    </span>
                  </div>
                  <div className="w-full bg-sage-200 rounded-full h-2">
                    <div
                      className="bg-tea-600 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage1}%` }}
                    />
                  </div>
                  <span className="text-xs text-sage-600">{item.percentage1}%</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-sage-800">
                      {item.university2}
                    </span>
                    <span className="text-sm text-sage-600">
                      {item.count2}명 선택
                    </span>
                  </div>
                  <div className="w-full bg-sage-200 rounded-full h-2">
                    <div
                      className="bg-sage-400 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage2}%` }}
                    />
                  </div>
                  <span className="text-xs text-sage-600">{item.percentage2}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

