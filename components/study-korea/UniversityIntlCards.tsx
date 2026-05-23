"use client";

import { useEffect, useState } from "react";

type IntlUniv = {
  id: number;
  name_kr: string;
  name_en: string;
  logo: string;
  intl_url: string;
};

type Props = { locale: "ko" | "en" };

export default function UniversityIntlCards({ locale }: Props) {
  const [list, setList] = useState<IntlUniv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/universities/intl")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setList(
            (json.universities ?? []).map(
              (u: {
                id: number;
                name_kr: string;
                name_en: string;
                logo?: string;
                intl_url?: string;
              }) => ({
                id: u.id,
                name_kr: u.name_kr,
                name_en: u.name_en,
                logo: u.logo ?? "",
                intl_url: u.intl_url ?? "",
              })
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;
  if (list.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-3">
        {locale === "ko"
          ? "대학 국제처 · 입학 안내"
          : "University international offices"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((u) => (
          <a
            key={u.id}
            href={u.intl_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-orange-500/50 transition-colors"
          >
            {u.logo ? (
              <img
                src={u.logo}
                alt=""
                className="h-10 w-10 rounded object-contain shrink-0 bg-gray-800"
              />
            ) : (
              <span
                className="h-10 w-10 rounded bg-gray-800 flex items-center justify-center text-gray-500 text-xs shrink-0"
                aria-hidden
              >
                🏫
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white truncate">{u.name_kr}</p>
              {u.name_en && (
                <p className="text-xs text-gray-400 truncate">{u.name_en}</p>
              )}
              <p className="text-xs text-orange-400 mt-1 font-medium">
                {locale === "ko" ? "국제처 바로가기 →" : "Intl admissions →"}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
