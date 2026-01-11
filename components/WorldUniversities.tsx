"use client";

import Link from "next/link";

export default function WorldUniversities() {
  const universities = [
    "성균관대학교",
    "중앙대학교",
    "연세대학교(서울캠)",
    "고려대학교(서울캠)",
    "서울대학교",
    "한양대학교",
    "건국대학교(서울캠)",
    "홍익대학교",
    "경희대학교(서울캠)",
    "이화여자대학교",
    "동국대학교(서울캠)",
    "동덕여자대학교",
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-sage-800">세계대학</h2>
          <Link href="/universities" className="text-tea-600 hover:text-tea-700 text-sm">
            more &gt;
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {universities.map((university, index) => (
            <Link
              key={index}
              href={`/universities/${encodeURIComponent(university)}`}
              className="bg-sage-50 rounded-lg p-4 text-center border border-sage-200 hover:bg-tea-50 hover:border-tea-300 transition-all"
            >
              <span className="text-sm font-medium text-sage-800">{university}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


