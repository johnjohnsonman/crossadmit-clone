"use client";

import Link from "next/link";
import { useState } from "react";
import CategorySidebar from "./CategorySidebar";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

type Props = {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  currentCategory?: string | null;
  sort?: string;
};

export default function RedditLayout({
  children,
  rightSidebar,
  currentCategory,
  sort = "hot",
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#DAE0E6] dark:bg-[#030303] reddit-forum">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#1A1A1B] border-b border-[#EDEFF1] dark:border-[#343536]">
        <div className="max-w-6xl mx-auto px-3 h-12 flex items-center gap-2">
          <button
            type="button"
            className="md:hidden p-2 text-lg"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
          >
            ☰
          </button>
          <Link
            href="/forum"
            className="flex items-center gap-1 shrink-0 font-bold text-[#FF4500] text-lg"
          >
            <span className="hidden sm:inline">CrossAdmit</span>
            <span className="sm:hidden">CA</span>
          </Link>
          <SearchBar />
          <Link
            href="/submit"
            className="hidden sm:inline-flex shrink-0 px-3 py-1.5 bg-[#FF4500] text-white text-xs font-bold rounded-full hover:bg-[#e03d00] transition-colors"
          >
            + Create Post
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close"
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#DAE0E6] dark:bg-[#1A1A1B] p-4 overflow-y-auto shadow-xl">
            <CategorySidebar
              currentCategory={currentCategory}
              sort={sort}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 py-4 grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[220px_1fr_300px] gap-4">
        <aside className="hidden md:block">
          <div className="sticky top-14">
            <CategorySidebar currentCategory={currentCategory} sort={sort} />
          </div>
        </aside>

        <main className="min-w-0">{children}</main>

        {rightSidebar && (
          <aside className="hidden lg:block">
            <div className="sticky top-14">{rightSidebar}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
