"use client";

import { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CrossAdmitComparison {
  id: string;
  university1: string;
  university2: string;
  percentage1: number;
  percentage2: number;
}

function ComparisonStrip({
  comparisons,
  basePath,
  copyKey,
}: {
  comparisons: CrossAdmitComparison[];
  basePath: string;
  copyKey: string;
}) {
  return (
    <>
      {comparisons.map((comp, index) => (
        <Fragment key={`${comp.id}-${index}-${copyKey}`}>
          <Link
            href={`${basePath}/${comp.id}`}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-10 transition-opacity hover:opacity-80"
          >
            <span className="text-xs font-medium text-sage-800 md:text-sm">
              {comp.university1}
            </span>
            <span className="text-[10px] font-medium text-sage-600 md:text-xs">
              vs
            </span>
            <span className="text-xs font-medium text-sage-800 md:text-sm">
              {comp.university2}
            </span>
            <span className="text-[10px] text-sage-500 md:text-xs">
              ({comp.percentage1}% vs {comp.percentage2}%)
            </span>
          </Link>
          <span
            className="inline-flex shrink-0 select-none items-center justify-center text-sm tabular-nums text-sage-400"
            aria-hidden
          >
            ·
          </span>
        </Fragment>
      ))}
    </>
  );
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
    <div className="relative z-40 mt-0 h-9 overflow-hidden border-b border-tea-200 bg-tea-100 py-1.5 md:h-11 md:py-2.5">
      <div className="flex overflow-hidden">
        {/* 한 트랙 = 동일 패턴 2벌 나란히, 끝에 pr로 복사본 사이 간격을 항목 간 gap과 동일하게 맞춤 */}
        <div className="flex w-max animate-ticker items-center">
          <div className="flex shrink-0 flex-row items-center gap-[60px] pr-[60px]">
            <ComparisonStrip
              comparisons={comparisons}
              basePath={basePath}
              copyKey="a"
            />
          </div>
          <div className="flex shrink-0 flex-row items-center gap-[60px] pr-[60px]">
            <ComparisonStrip
              comparisons={comparisons}
              basePath={basePath}
              copyKey="b"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
