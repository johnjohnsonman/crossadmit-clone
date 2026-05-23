"use client";

import { useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function LoginPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-800">
          <div className="flex space-x-4 mb-6">
            <button
              type="button"
              onClick={() => setIsSignIn(true)}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                isSignIn
                  ? "border-orange-500 text-orange-400 font-medium"
                  : "border-transparent text-gray-400"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => setIsSignIn(false)}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                !isSignIn
                  ? "border-orange-500 text-orange-400 font-medium"
                  : "border-transparent text-gray-400"
              }`}
            >
              회원가입
            </button>
          </div>

          {isSignIn ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center text-gray-400">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">로그인 상태 유지</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-orange-400 hover:text-orange-300"
                >
                  비밀번호 찾기
                </Link>
              </div>
              <button
                type="button"
                className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                로그인
              </button>
              <div className="text-center">
                <span className="text-sm text-gray-500">또는</span>
              </div>
              <button
                type="button"
                className="w-full border border-gray-700 text-gray-300 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                Email 회원가입
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  이메일
                </label>
                <input type="email" className={inputClass} placeholder="이메일을 입력하세요" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  비밀번호
                </label>
                <input type="password" className={inputClass} placeholder="비밀번호를 입력하세요" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>
              <button
                type="button"
                className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                회원가입
              </button>
              <div className="text-center">
                <span className="text-sm text-gray-500">또는</span>
              </div>
              <button
                type="button"
                className="w-full border border-gray-700 text-gray-300 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                소셜 로그인
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
