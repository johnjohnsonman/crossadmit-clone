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

  const navLink =
    "text-sm text-gray-300 hover:text-orange-400 transition-colors";
  const navLinkBold = `${navLink} font-semibold`;
  const mobileLink =
    "block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-orange-400";

  return (
    <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16 py-2 md:py-3">
          <div className="flex items-center space-x-2 md:space-x-8">
            <Link
              href={href("/")}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-base md:text-2xl font-bold text-orange-500 tracking-wide whitespace-nowrap">
                CROSSADMIT
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href={href("/crossadmit")} className={navLinkBold}>
                {t.nav_crossadmit}
              </Link>
              <Link href={href("/forum")} className={navLink}>
                {t.nav_forum}
              </Link>
              <Link href={href("/admissions")} className={navLink}>
                {t.nav_admissions}
              </Link>
              <Link href={href("/mentors")} className={navLink}>
                {t.nav_mentors}
              </Link>
              <Link href={href("/study-korea")} className={navLink}>
                {t.nav_guide}
              </Link>
              <Link href={href("/videos")} className={navLink}>
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
              className="hidden md:block px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-300 hover:text-orange-400 transition-colors"
            >
              {t.nav_login}
            </Link>
            <Link
              href={href("/signup")}
              className="hidden md:block px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              {t.nav_signup}
            </Link>
            <button
              type="button"
              className="md:hidden p-1.5 text-gray-300"
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
          <div className="md:hidden py-3 space-y-1 border-t border-gray-800">
            <Link
              href={href("/crossadmit")}
              className={`${mobileLink} font-semibold`}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_crossadmit}
            </Link>
            <Link
              href={href("/forum")}
              className={mobileLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_forum}
            </Link>
            <Link
              href={href("/admissions")}
              className={mobileLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_admissions}
            </Link>
            <Link
              href={href("/mentors")}
              className={mobileLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_mentors}
            </Link>
            <Link
              href={href("/study-korea")}
              className={mobileLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_guide}
            </Link>
            <Link
              href={href("/videos")}
              className={mobileLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_videos}
            </Link>
            <div className="px-4 py-2 border-t border-gray-800 pt-3">
              <LanguageToggle />
            </div>
            <Link
              href={href("/login")}
              className={mobileLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav_login}
            </Link>
            <Link
              href={href("/signup")}
              className="block mx-4 mt-2 px-4 py-2 text-sm text-center bg-orange-500 text-white rounded-md hover:bg-orange-600"
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
        <nav className="bg-gray-950 border-b border-gray-800 h-14 md:h-16" />
      }
    >
      <NavbarInner />
    </Suspense>
  );
}
