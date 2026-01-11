"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavbarEN() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-sage-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between min-h-[80px] py-3">
          <div className="flex items-center space-x-8">
            <Link href="/en" className="flex items-center hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.svg" 
                alt="CROSSADMIT" 
                width={160} 
                height={50}
                className="h-14 w-auto object-contain"
                priority
              />
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/en/crossadmit" className="text-sage-700 hover:text-tea-600 transition-colors font-semibold">
                CrossAdmit
              </Link>
              <Link href="/en/forum" className="text-sage-700 hover:text-tea-600 transition-colors">
                Forum
              </Link>
              <Link href="/en/admissions" className="text-sage-700 hover:text-tea-600 transition-colors">
                Admissions DB
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Link
              href="/en/login"
              className="px-4 py-2 text-sage-700 hover:text-tea-600 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/en/signup"
              className="px-4 py-2 bg-tea-600 text-white rounded-md hover:bg-tea-700 transition-colors"
            >
              Sign Up
            </Link>
            <button
              className="md:hidden p-2 text-sage-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link href="/en/crossadmit" className="block px-4 py-2 text-sage-700 hover:bg-sage-50 font-semibold">CrossAdmit</Link>
            <Link href="/en/forum" className="block px-4 py-2 text-sage-700 hover:bg-sage-50">Forum</Link>
            <Link href="/en/admissions" className="block px-4 py-2 text-sage-700 hover:bg-sage-50">Admissions DB</Link>
            <div className="px-4 py-2">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
