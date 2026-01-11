"use client";

import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-tea-50 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-sage-200">
          <h1 className="text-2xl font-serif text-sage-800 mb-6 text-center">회원가입</h1>
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
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-sage-600">
                이용약관 및 개인정보처리방침에 동의합니다
              </span>
            </div>
            <button className="w-full bg-tea-600 text-white py-2 rounded-md hover:bg-tea-700 transition-colors">
              회원가입
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-tea-600 hover:text-tea-700">
                이미 계정이 있으신가요? 로그인하러 가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


