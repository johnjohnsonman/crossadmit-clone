import { Metadata } from "next";
import { Suspense } from "react";
import CrossAdmitPage from "./crossadmit/page";

export const metadata: Metadata = {
  title: "CrossAdmit | Study in Korea & University Admission Statistics",
  description:
    "Study in Korea guides for international students — visa, admissions, scholarships — plus university choice statistics when students are accepted to multiple schools. 한국 유학·합격 통계.",
  keywords: [
    "크로스어드밋",
    "대학 선택 통계",
    "서울대 연세대 비교",
    "고려대 연세대 비교",
    "대학 합격 통계",
    "입시 정보",
    "대학 비교",
    "CrossAdmit",
    "university admission statistics",
    "Korea university comparison",
    "study in Korea",
    "Korean university admission",
    "SNU vs Yonsei",
    "Korea University vs Yonsei",
    "交叉录取",
    "韩国大学",
    "留学韩国",
    "大学录取统计",
    "首尔大学",
    "延世大学",
    "高丽大学",
    "admisión universitaria",
    "estudiar en Corea",
    "universidad coreana",
    "Seoul National University",
    "Yonsei University",
    "Korea University",
  ],
  alternates: {
    canonical: "https://crossadmit.com",
    languages: {
      ko: "https://crossadmit.com",
      en: "https://crossadmit.com?lang=en",
      "zh-CN": "https://crossadmit.com/zh",
      "zh-TW": "https://crossadmit.com/zh-tw",
      es: "https://crossadmit.com/es",
      ja: "https://crossadmit.com/ja",
    },
  },
  openGraph: {
    title: "크로스어드밋 | 대학 선택 통계 | CrossAdmit | 交叉录取",
    description:
      "두 대학에 동시에 합격했을 때 학생들의 선택 통계를 확인하세요. Compare university admission statistics. 比较大学录取统计。",
    type: "website",
    url: "https://crossadmit.com",
    locale: "ko_KR",
    alternateLocale: ["en_US", "zh_CN", "zh_TW", "es_ES", "ja_JP"],
  },
};

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-950 flex items-center justify-center">
          <p className="text-gray-400">Loading…</p>
        </main>
      }
    >
      <CrossAdmitPage />
    </Suspense>
  );
}
