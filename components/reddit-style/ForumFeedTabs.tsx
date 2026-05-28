"use client";

import Link from "next/link";
import type { ForumFeedKind } from "@/lib/forum/feed-kind";

const TABS: { id: ForumFeedKind; label: string }[] = [
  { id: "discussions", label: "💬 Discussions" },
  { id: "guides", label: "📚 Guides" },
  { id: "news", label: "📰 News" },
];

type Props = {
  active: ForumFeedKind;
  sort: string;
};

function buildHref(tab: ForumFeedKind, sort: string): string {
  const params = new URLSearchParams();
  if (tab !== "discussions") params.set("tab", tab);
  if (sort && sort !== "new") params.set("sort", sort);
  const q = params.toString();
  return q ? `/forum?${q}` : "/forum";
}

export default function ForumFeedTabs({ active, sort }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-[#EDEFF1] dark:border-[#343536] bg-white dark:bg-[#1A1A1B] rounded-t px-2 overflow-x-auto mb-0">
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            href={buildHref(t.id, sort)}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 -mb-px ${
              isActive
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
