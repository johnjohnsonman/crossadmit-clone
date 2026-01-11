"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <main className="min-h-screen bg-tea-50 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-sage-200">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setIsSignIn(true)}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                isSignIn
                  ? "border-tea-600 text-tea-600 font-medium"
                  : "border-transparent text-sage-600"
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setIsSignIn(false)}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                !isSignIn
                  ? "border-tea-600 text-tea-600 font-medium"
                  : "border-transparent text-sage-600"
              }`}
            >
              회원가입
            </button>
          </div>

          {isSignIn ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tea-500"
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tea-500"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-sage-600">로그인 상태 유지</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-tea-600 hover:text-tea-700">
                  비밀번호 찾기
                </Link>
              </div>
              <button className="w-full bg-tea-600 text-white py-2 rounded-md hover:bg-tea-700 transition-colors">
                로그인
              </button>
              <div className="text-center">
                <span className="text-sm text-sage-600">또는</span>
              </div>
              <button className="w-full border border-sage-300 text-sage-700 py-2 rounded-md hover:bg-sage-50 transition-colors">
                Email 회원가입
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tea-500"
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tea-500"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tea-500"
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>
              <button className="w-full bg-tea-600 text-white py-2 rounded-md hover:bg-tea-700 transition-colors">
                회원가입
              </button>
              <div className="text-center">
                <span className="text-sm text-sage-600">또는</span>
              </div>
              <button className="w-full border border-sage-300 text-sage-700 py-2 rounded-md hover:bg-sage-50 transition-colors">
                소셜 로그인
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


