"use client";

import Link from "next/link";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavbarEN() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-sage-200 sticky top-0 z-50 relative shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16 py-2 md:py-3">
          <div className="flex items-center space-x-2 md:space-x-8">
            <Link href="/en" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="text-base md:text-2xl font-bold text-[#8B6F47] tracking-wide whitespace-nowrap">
                CROSSADMIT
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/en/crossadmit" className="text-sm text-sage-700 hover:text-tea-600 transition-colors font-semibold">
                CrossAdmit
              </Link>
              <Link href="/en/forum" className="text-sm text-sage-700 hover:text-tea-600 transition-colors">
                Forum
              </Link>
              <Link href="/en/admissions" className="text-sm text-sage-700 hover:text-tea-600 transition-colors">
                Admissions DB
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-1 md:space-x-4">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <Link
              href="/en/login"
              className="hidden md:block px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-sage-700 hover:text-tea-600 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/en/signup"
              className="hidden md:block px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-tea-600 text-white rounded-md hover:bg-tea-700 transition-colors"
            >
              Sign Up
            </Link>
            <button
              className="md:hidden p-1.5 text-sage-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden py-3 space-y-1 border-t border-sage-200">
            <Link href="/en/crossadmit" className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50 font-semibold" onClick={() => setIsMenuOpen(false)}>CrossAdmit</Link>
            <Link href="/en/forum" className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50" onClick={() => setIsMenuOpen(false)}>Forum</Link>
            <Link href="/en/admissions" className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50" onClick={() => setIsMenuOpen(false)}>Admissions DB</Link>
            <div className="px-4 py-2 border-t border-sage-200 pt-3">
              <LanguageSwitcher />
            </div>
            <Link href="/en/login" className="block px-4 py-2 text-sm text-sage-700 hover:bg-sage-50" onClick={() => setIsMenuOpen(false)}>Login</Link>
            <Link href="/en/signup" className="block px-4 py-2 text-sm bg-tea-600 text-white rounded-md hover:bg-tea-700 mx-4" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
