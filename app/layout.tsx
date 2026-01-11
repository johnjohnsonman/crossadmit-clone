import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FloatingAdmissions from "@/components/FloatingAdmissions";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";

export const metadata: Metadata = {
  title: {
    default: "크로스어드밋 | 대학 선택 통계 및 합격자 데이터베이스 | CrossAdmit | 交叉录取",
    template: "%s | 크로스어드밋",
  },
  description: "두 대학에 동시에 합격했을 때 학생들의 선택 통계를 확인하세요. 대학 합격자 정보, 입시 데이터, 크로스어드밋 통계를 제공합니다. Compare university admission statistics when students are accepted to multiple universities. 比较同时被多所大学录取时的学生选择统计。",
  keywords: [
    "크로스어드밋",
    "대학 선택",
    "합격 통계",
    "입시 정보",
    "대학 비교",
    "합격자 데이터베이스",
    "대학 입시",
    "수시 정시",
    "서울대",
    "연세대",
    "고려대",
    "대학 합격",
    "CrossAdmit",
    "university admission statistics",
    "Korea university comparison",
    "study in Korea",
    "Korean university admission",
    "交叉录取",
    "韩国大学",
    "留学韩国",
    "大学录取统计",
    "admisión universitaria",
    "estudiar en Corea",
    "universidad coreana",
  ],
  alternates: {
    canonical: "https://crossadmit.com",
    languages: {
      ko: "https://crossadmit.com",
      en: "https://crossadmit.com/en",
      "zh-CN": "https://crossadmit.com/zh",
      "zh-TW": "https://crossadmit.com/zh-tw",
      es: "https://crossadmit.com/es",
      ja: "https://crossadmit.com/ja",
    },
  },
  authors: [{ name: "크로스어드밋" }],
  creator: "크로스어드밋",
  publisher: "크로스어드밋",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: ["en_US", "zh_CN", "zh_TW", "es_ES", "ja_JP"],
    url: "https://crossadmit.com",
    siteName: "크로스어드밋 | CrossAdmit | 交叉录取",
    title: "크로스어드밋 | 대학 선택 통계 및 합격자 데이터베이스 | CrossAdmit | 交叉录取",
    description: "두 대학에 동시에 합격했을 때 학생들의 선택 통계를 확인하세요. Compare university admission statistics. 比较大学录取统计。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "크로스어드밋 | CrossAdmit | 交叉录取",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "크로스어드밋 | 대학 선택 통계 및 합격자 데이터베이스",
    description: "두 대학에 동시에 합격했을 때 학생들의 선택 통계를 확인하세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console 인증 코드 (나중에 추가)
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "크로스어드밋 | CrossAdmit | 交叉录取",
    alternateName: ["CrossAdmit", "交叉录取"],
    url: "https://crossadmit.com",
    logo: "https://crossadmit.com/logo.png",
    description: "대학 선택 통계 및 합격자 데이터베이스 | University admission statistics and database | 大学选择统计和录取数据库",
    inLanguage: ["ko", "en", "zh-CN", "zh-TW", "es", "ja"],
    sameAs: [
      // 소셜 미디어 링크 추가 가능
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "크로스어드밋 | CrossAdmit | 交叉录取",
    alternateName: ["CrossAdmit", "交叉录取"],
    url: "https://crossadmit.com",
    inLanguage: ["ko", "en", "zh-CN", "zh-TW", "es", "ja"],
    description: "대학 선택 통계 및 합격자 데이터베이스 | University admission statistics | 大学选择统计",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://crossadmit.com/crossadmit?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ko">
      <head>
        <StructuredData data={organizationSchema} />
        <StructuredData data={websiteSchema} />
        {/* 다국어 hreflang 태그 */}
        <link rel="alternate" hrefLang="ko" href="https://crossadmit.com" />
        <link rel="alternate" hrefLang="en" href="https://crossadmit.com/en" />
        <link rel="alternate" hrefLang="zh-CN" href="https://crossadmit.com/zh" />
        <link rel="alternate" hrefLang="zh-TW" href="https://crossadmit.com/zh-tw" />
        <link rel="alternate" hrefLang="es" href="https://crossadmit.com/es" />
        <link rel="alternate" hrefLang="ja" href="https://crossadmit.com/ja" />
        <link rel="alternate" hrefLang="x-default" href="https://crossadmit.com" />
      </head>
      <body className="antialiased">
        <Navbar />
        <FloatingAdmissions />
        {children}
        <Footer />
      </body>
    </html>
  );
}

