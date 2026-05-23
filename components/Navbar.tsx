"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LanguageToggle from "./LanguageToggle";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import { withLang } from "@/lib/i18n/locale";

function NavbarInner() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const locale: Locale = searchParams.get("lang") === "en" ? "en" : "ko";
  const t = getDictionary(locale);

  const href = (path: string) => withLang(path, locale);

  return (
    <nav className="bg-white border-b border-sage-200 sticky top-0 z-50 relative shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16 py-2 md:py-3">
          <div className="flex items-center space-x-2 md:space-x-8">
            <Link
              href={href("/")}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-base md:text-2xl font-bold text-[#8B6F47] tracking-wide whitespace-nowrap">
                CROSSADMIT
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href={href("/crossadmit")}
                className="text-sm text-sage-700 hover:text-tea-600 transition-colors font-semibold"
              >
                {t.nav_crossadmit}
              </Link>
              <Link
                href={href("/forum")}
                className="text-sm text-sage-700 hover:text-tea-600 transition-colors"
              >
                {t.nav_forum}
              </Link>
              <Link
                href={href("/admissions")}
                className="text-sm text-sage-700 hover:text-tea-600 transition-colors"
              >
                {t.nav_admissions}
              </Link>
              <Link
                href={href("/mentors")}
                className="text-sm text-sage-700 hover:text-tea-600 transition-colors"
              >
                {t.nav_mentors}
              </Link>
              <Link
                href={href("/study-korea")}
                className="text-sm text-sage-700 hover:text-tea-600 transition-colors"
              >
                {t.nav_guide}
              </Link>
              <Link
                href={href("/videos")}
                className="text-sm text-sage-700 hover:text-tea-600 transition-colors"
              >
                {t.nav_videos}
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-1 md:space-x-4">
            <div className="hidden md:block">
              <LanguageToggle />
            </div>
            <Link
              href={href("/login")}
              className="hidden md:block px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-sage-700 hover:text-tea-600 transition-colors"
            >
              {t.nav_login}
            </Link>
            <Link
              href={href("/signup")}
              className="hidden md:block px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-tea-600 text-white rounded-md hover:bg-tea-700 transition-colors"
            >
              {t.nav_signup}
            </Link>
            <button
              type="button"
              className="md:hidden p-1.5 text-sage-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden py-3 space-y-1 border-t border-sage-200">
            <Link
              href={href("/crossadmit")}
              className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50 font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_crossadmit}
            </Link>
            <Link
              href={href("/forum")}
              className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_forum}
            </Link>
            <Link
              href={href("/admissions")}
              className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_admissions}
            </Link>
            <Link
              href={href("/mentors")}
              className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_mentors}
            </Link>
            <Link
              href={href("/study-korea")}
              className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_guide}
            </Link>
            <Link
              href={href("/videos")}
              className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_videos}
            </Link>
            <div className="px-4 py-2 border-t border-sage-200 pt-3">
              <LanguageToggle />
            </div>
            <Link
              href={href("/login")}
              className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_login}
            </Link>
            <Link
              href={href("/signup")}
              className="block px-4 py-2 text-sm bg-tea-600 text-white rounded-md hover:bg-tea-700 mx-4"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_signup}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <nav className="bg-white border-b border-sage-200 h-14 md:h-16" />
      }
    >
      <NavbarInner />
    </Suspense>
  );
}
