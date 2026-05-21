"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";

type TickerItem = {
  admission_id: number;
  univ_name: string;
  dept_name: string;
};

export default function RegistrationTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    fetch("/api/admissions/ticker")
      .then((r) => r.json())
      .then((data: { items?: TickerItem[] }) => {
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-b border-emerald-200/80 bg-emerald-50/90 py-2 text-sm text-emerald-900">
      <div className="ticker-track animate-ticker flex w-max gap-8 whitespace-nowrap px-4">
        {doubled.map((item, i) => (
          <Fragment key={`${item.admission_id}-${i}`}>
            <Link
              href={`/admissions/${item.admission_id}`}
              className="inline-flex shrink-0 items-center gap-1 hover:underline"
            >
              <span className="font-semibold text-emerald-800">[등록]</span>
              <span>
                {item.univ_name} {item.dept_name}
              </span>
            </Link>
            <span className="text-emerald-400" aria-hidden>
              ·
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
