"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CrossAdmitComparison {
  id: string;
  university1: string;
  university2: string;
  percentage1: number;
  percentage2: number;
}

export default function FloatingAdmissions() {
  const [comparisons, setComparisons] = useState<CrossAdmitComparison[]>([]);
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith("/en");

  useEffect(() => {
    fetch("/api/crossadmit")
      .then((res) => res.json())
      .then((data) => {
        if (data.comparisons && data.comparisons.length > 0) {
          setComparisons(data.comparisons.slice(0, 8)); // 최근 8개만 표시
        } else {
          // 샘플 데이터
          setComparisons([
            { id: "seoul-vs-korea", university1: "서울대학교", university2: "고려대학교(서울캠)", percentage1: 60, percentage2: 40 },
            { id: "yonsei-vs-korea", university1: "연세대학교(서울캠)", university2: "고려대학교(서울캠)", percentage1: 55, percentage2: 45 },
            { id: "seoul-vs-yonsei", university1: "서울대학교", university2: "연세대학교(서울캠)", percentage1: 65, percentage2: 35 },
            { id: "snu-vs-skk", university1: "서울대학교", university2: "성균관대학교", percentage1: 70, percentage2: 30 },
            { id: "yonsei-vs-hanyang", university1: "연세대학교(서울캠)", university2: "한양대학교", percentage1: 58, percentage2: 42 },
          ]);
        }
      })
      .catch(() => {
        // 에러 시 샘플 데이터
        setComparisons([
          { id: "seoul-vs-korea", university1: "서울대학교", university2: "고려대학교(서울캠)", percentage1: 60, percentage2: 40 },
          { id: "yonsei-vs-korea", university1: "연세대학교(서울캠)", university2: "고려대학교(서울캠)", percentage1: 55, percentage2: 45 },
          { id: "seoul-vs-yonsei", university1: "서울대학교", university2: "연세대학교(서울캠)", percentage1: 65, percentage2: 35 },
        ]);
      });
  }, []);

  if (comparisons.length === 0) return null;

  const basePath = isEnglish ? "/en/crossadmit" : "/crossadmit";

  return (
    <div className="bg-tea-100 border-b border-tea-200 py-2.5 overflow-hidden relative h-11 z-40 mt-0">
      <div className="absolute inset-0 flex items-center" style={{ pointerEvents: 'none' }}>
        {/* 첫 번째 세트 */}
        {comparisons.map((comp, index) => (
          <Link
            key={`${comp.id}-${index}`}
            href={`${basePath}/${comp.id}`}
            className="flex items-center space-x-2 whitespace-nowrap animate-scroll hover:opacity-80 transition-opacity cursor-pointer px-8"
            style={{
              pointerEvents: 'auto',
              animationDelay: `${index * 6}s`,
              animationDuration: "40s",
              transform: `translateX(${100 + index * 150}vw)`,
            }}
          >
            <span className="text-sm font-medium text-sage-800">
              {comp.university1}
            </span>
            <span className="text-xs text-sage-600 font-medium">vs</span>
            <span className="text-sm font-medium text-sage-800">
              {comp.university2}
            </span>
            <span className="text-xs text-sage-500">
              ({comp.percentage1}% vs {comp.percentage2}%)
            </span>
          </Link>
        ))}
        {/* 반복을 위해 같은 데이터를 한 번 더 */}
        {comparisons.map((comp, index) => (
          <Link
            key={`${comp.id}-${index}-dup`}
            href={`${basePath}/${comp.id}`}
            className="flex items-center space-x-2 whitespace-nowrap animate-scroll hover:opacity-80 transition-opacity cursor-pointer px-8"
            style={{
              pointerEvents: 'auto',
              animationDelay: `${(index + comparisons.length) * 6}s`,
              animationDuration: "40s",
              transform: `translateX(${100 + (index + comparisons.length) * 150}vw)`,
            }}
          >
            <span className="text-sm font-medium text-sage-800">
              {comp.university1}
            </span>
            <span className="text-xs text-sage-600 font-medium">vs</span>
            <span className="text-sm font-medium text-sage-800">
              {comp.university2}
            </span>
            <span className="text-xs text-sage-500">
              ({comp.percentage1}% vs {comp.percentage2}%)
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

