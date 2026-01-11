import type { Metadata } from "next";
import "../globals.css";
import NavbarEN from "@/components/NavbarEN";
import FloatingAdmissions from "@/components/FloatingAdmissions";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";

export const metadata: Metadata = {
  title: {
    default: "CrossAdmit | University Admission Statistics | 크로스어드밋",
    template: "%s | CrossAdmit",
  },
  description: "Compare university admission statistics when students are accepted to multiple universities. Korean university admission information, cross-admit statistics. 두 대학에 동시에 합격했을 때 학생들의 선택 통계를 확인하세요.",
  keywords: [
    "CrossAdmit",
    "university admission statistics",
    "Korea university comparison",
    "study in Korea",
    "Korean university admission",
    "SNU vs Yonsei",
    "Korea University vs Yonsei",
    "university choice statistics",
    "admission comparison",
    "크로스어드밋",
    "대학 선택 통계",
  ],
  alternates: {
    canonical: "https://crossadmit.com/en",
    languages: {
      ko: "https://crossadmit.com",
      en: "https://crossadmit.com/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ko_KR"],
    url: "https://crossadmit.com/en",
    siteName: "CrossAdmit | 크로스어드밋",
    title: "CrossAdmit | University Admission Statistics",
    description: "Compare university admission statistics when students are accepted to multiple universities.",
  },
};

export default function RootLayoutEN({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CrossAdmit | 크로스어드밋",
    alternateName: ["크로스어드밋"],
    url: "https://crossadmit.com",
    logo: "https://crossadmit.com/logo.png",
    description: "University admission statistics and database | 대학 선택 통계 및 합격자 데이터베이스",
    inLanguage: ["en", "ko"],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CrossAdmit | 크로스어드밋",
    alternateName: ["크로스어드밋"],
    url: "https://crossadmit.com",
    inLanguage: ["en", "ko"],
    description: "University admission statistics | 대학 선택 통계",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://crossadmit.com/en/crossadmit?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        {/* Pretendard 폰트 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <StructuredData data={organizationSchema} />
        <StructuredData data={websiteSchema} />
        <link rel="alternate" hrefLang="ko" href="https://crossadmit.com" />
        <link rel="alternate" hrefLang="en" href="https://crossadmit.com/en" />
        <link rel="alternate" hrefLang="x-default" href="https://crossadmit.com" />
      </head>
      <body className="antialiased">
        <NavbarEN />
        <FloatingAdmissions />
        {children}
        <Footer />
      </body>
    </html>
  );
}
