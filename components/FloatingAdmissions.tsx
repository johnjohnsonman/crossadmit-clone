"use client";

import { Fragment, useState, useEffect } from "react";
import Link from "next/link";

type TickerItem = {
  admissionId: number;
  univName: string;
  deptName: string;
};

function TickerStrip({
  items,
  copyKey,
}: {
  items: TickerItem[];
  copyKey: string;
}) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={`${item.admissionId}-${index}-${copyKey}`}>
          <Link
            href={`/admissions/${item.admissionId}`}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-10 transition-opacity hover:opacity-80"
          >
            <span className="text-xs font-semibold text-emerald-800 md:text-sm">
              [등록]
            </span>
            <span className="text-xs font-medium text-sage-800 md:text-sm">
              {item.univName}
            </span>
            <span className="text-xs text-sage-700 md:text-sm">
              {item.deptName}
            </span>
          </Link>
          <span
            className="inline-flex shrink-0 select-none items-center justify-center text-sm text-sage-400"
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
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    fetch("/api/admissions/ticker")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.items ?? []) as TickerItem[];
        if (list.length > 0) setItems(list);
      })
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="relative z-40 mt-0 h-9 overflow-hidden border-b border-tea-200 bg-tea-100 py-1.5 md:h-11 md:py-2.5">
      <div className="flex overflow-hidden">
        <div className="flex w-max animate-ticker items-center">
          <div className="flex shrink-0 flex-row items-center gap-[60px] pr-[60px]">
            <TickerStrip items={items} copyKey="a" />
          </div>
          <div className="flex shrink-0 flex-row items-center gap-[60px] pr-[60px]">
            <TickerStrip items={items} copyKey="b" />
          </div>
        </div>
      </div>
    </div>
  );
}
