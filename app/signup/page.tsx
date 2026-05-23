"use client";

import Link from "next/link";

const inputClass =
  "w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-800">
          <h1 className="text-2xl font-serif text-white mb-6 text-center">회원가입</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">이메일</label>
              <input type="email" className={inputClass} placeholder="이메일을 입력하세요" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호</label>
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
            <div className="flex items-center text-gray-400">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">이용약관 및 개인정보처리방침에 동의합니다</span>
            </div>
            <button
              type="button"
              className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              회원가입
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-orange-400 hover:text-orange-300">
                이미 계정이 있으신가요? 로그인하러 가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
