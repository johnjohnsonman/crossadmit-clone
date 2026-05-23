"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { REDDIT_CATEGORIES } from "@/lib/forum/reddit-categories";

type Props = {
  currentCategory?: string | null;
  sort?: string;
  onNavigate?: () => void;
};

export default function CategorySidebar({
  currentCategory,
  sort = "hot",
  onNavigate,
}: Props) {
  const pathname = usePathname();
  const isForumHome = pathname === "/forum";

  const linkClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
      active
        ? "bg-white dark:bg-[#272729] text-[#1C1C1C] dark:text-white font-semibold shadow-sm"
        : "text-[#1C1C1C] dark:text-[#D7DADC] hover:bg-white/80 dark:hover:bg-[#272729]/80"
    }`;

  return (
    <nav className="space-y-4 text-sm">
      <div>
        <p className="px-3 mb-1 text-xs font-bold uppercase text-[#7C7C7C]">
          Popular
        </p>
        <Link
          href="/forum"
          onClick={onNavigate}
          className={linkClass(isForumHome && !currentCategory)}
        >
          🏠 All Posts
        </Link>
        <Link
          href="/forum?sort=hot"
          onClick={onNavigate}
          className={linkClass(isForumHome && sort === "hot")}
        >
          🔥 Hot
        </Link>
        <Link
          href="/forum?sort=new"
          onClick={onNavigate}
          className={linkClass(isForumHome && sort === "new")}
        >
          ✨ New
        </Link>
        <Link
          href="/forum?sort=top"
          onClick={onNavigate}
          className={linkClass(isForumHome && sort === "top")}
        >
          ⬆ Top
        </Link>
      </div>

      <div>
        <p className="px-3 mb-1 text-xs font-bold uppercase text-[#7C7C7C]">
          Categories
        </p>
        {REDDIT_CATEGORIES.map((c) => {
          const active =
            currentCategory === c.id ||
            pathname === `/r/${c.id}`;
          return (
            <Link
              key={c.id}
              href={`/r/${c.id}`}
              onClick={onNavigate}
              className={linkClass(active)}
            >
              <span>{c.emoji}</span>
              <span>r/{c.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
