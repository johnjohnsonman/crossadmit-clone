"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-sage-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 py-2">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.svg" 
                alt="CROSSADMIT" 
                width={140} 
                height={40}
                className="h-12 w-auto object-contain"
                priority
              />
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/crossadmit" className="text-sage-700 hover:text-tea-600 transition-colors font-semibold">
                크로스어드밋
              </Link>
              <Link href="/forum" className="text-sage-700 hover:text-tea-600 transition-colors">
                포럼
              </Link>
              <Link href="/admissions" className="text-sage-700 hover:text-tea-600 transition-colors">
                합격DB
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="px-4 py-2 text-sage-700 hover:text-tea-600 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-tea-600 text-white rounded-md hover:bg-tea-700 transition-colors"
            >
              회원가입
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
              <Link href="/crossadmit" className="block px-4 py-2 text-sage-700 hover:bg-sage-50 font-semibold">크로스어드밋</Link>
              <Link href="/forum" className="block px-4 py-2 text-sage-700 hover:bg-sage-50">포럼</Link>
              <Link href="/admissions" className="block px-4 py-2 text-sage-700 hover:bg-sage-50">합격DB</Link>
              <div className="px-4 py-2">
                <LanguageSwitcher />
              </div>
          </div>
        )}
      </div>
    </nav>
  );
}


