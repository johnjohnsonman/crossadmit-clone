"use client";

import { useEffect, useState } from "react";
import type { UniversityPick } from "@/components/crossadmit/UniversityAutocomplete";

type PopularUniv = UniversityPick & { score: number; logo?: string };

type Props = {
  locale?: "ko" | "en";
  onSelect: (u: UniversityPick) => void;
  activeId?: number | null;
};

export default function ForumPopularSidebar({
  locale = "ko",
  onSelect,
  activeId,
}: Props) {
  const [list, setList] = useState<PopularUniv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, univRes] = await Promise.all([
          fetch("/api/cross-comparisons?stats=1&sort=popular"),
          fetch("/api/universities?autocomplete=1"),
        ]);
        const statsJson = await statsRes.json();
        const univJson = await univRes.json();
        const logoById = new Map<number, string>();
        for (const u of univJson.universities ?? []) {
          logoById.set(u.id, u.logo ?? "");
        }

        const counts = new Map<
          number,
          { name_kr: string; name_en: string; score: number }
        >();
        for (const s of statsJson.stats ?? []) {
          const add = (
            id: number,
            name: string,
            nameEn?: string
          ) => {
            const cur = counts.get(id);
            const n = (cur?.score ?? 0) + (s.count ?? 1);
            counts.set(id, {
              name_kr: cur?.name_kr ?? name,
              name_en: cur?.name_en ?? nameEn ?? "",
              score: n,
            });
          };
          if (s.univ_id_win) add(s.univ_id_win, s.univ_name_win);
          if (s.univ_id_lose) add(s.univ_id_lose, s.univ_name_lose);
        }

        const sorted = [...counts.entries()]
          .sort((a, b) => b[1].score - a[1].score)
          .slice(0, 8)
          .map(([id, v]) => ({
            id,
            name_kr: v.name_kr,
            name_en: v.name_en,
            score: v.score,
            logo: logoById.get(id),
          }));

        if (!cancelled) setList(sorted);
      } catch {
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="rounded-xl border border-[#E5E5E0] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
        {locale === "ko" ? "인기 대학" : "Popular universities"}
      </h2>
      <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
        {locale === "ko"
          ? "크로스 비교 데이터 기준"
          : "By cross-comparison activity"}
      </p>
      {loading ? (
        <ul className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-10 rounded-lg bg-[#F5F5F4] animate-pulse" />
          ))}
        </ul>
      ) : list.length === 0 ? (
        <p className="mt-4 text-xs text-[#9CA3AF]">데이터 없음</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {list.map((u, i) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onSelect(u)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                  activeId === u.id
                    ? "bg-[#EBF5EB] text-[#2D5A27]"
                    : "hover:bg-[#FAFAF8] text-[#1A1A1A]"
                }`}
              >
                <span className="w-5 text-xs font-medium text-[#9CA3AF] tabular-nums">
                  {i + 1}
                </span>
                {u.logo ? (
                  <img
                    src={u.logo}
                    alt=""
                    className="h-7 w-7 rounded object-contain bg-[#FAFAF8] shrink-0"
                  />
                ) : (
                  <span className="h-7 w-7 rounded bg-[#F5F5F4] flex items-center justify-center text-[10px] shrink-0">
                    🏫
                  </span>
                )}
                <span className="min-w-0 flex-1 text-sm font-medium truncate">
                  {locale === "ko" ? u.name_kr : u.name_en || u.name_kr}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
