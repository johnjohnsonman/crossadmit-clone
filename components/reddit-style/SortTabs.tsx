"use client";

import Link from "next/link";

const TABS = [
  { id: "hot", label: "🔥 Hot", icon: true },
  { id: "new", label: "✨ New", icon: true },
  { id: "top", label: "⬆ Top", icon: true },
] as const;

type Props = {
  sort: string;
  basePath?: string;
  defaultSort?: "hot" | "new";
};

export default function SortTabs({
  sort,
  basePath = "/forum",
  defaultSort = "hot",
}: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-[#EDEFF1] dark:border-[#343536] bg-white dark:bg-[#1A1A1B] rounded-t px-2 overflow-x-auto">
      {TABS.map((t) => {
        const active =
          sort === t.id ||
          (t.id === "hot" && sort === "popular") ||
          (t.id === defaultSort && !sort);
        const href =
          basePath === "/forum"
            ? t.id === defaultSort
              ? "/forum"
              : `/forum?sort=${t.id}`
            : `${basePath}?sort=${t.id}`;
        return (
          <Link
            key={t.id}
            href={href}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 -mb-px ${
              active
                ? "border-orange-500 text-orange-400 dark:text-orange-400"
                : "border-transparent text-[#7C7C7C] hover:bg-[#F6F7F8] dark:hover:bg-[#272729]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
