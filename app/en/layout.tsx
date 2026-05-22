import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "CrossAdmit | University Admission Statistics | 크로스어드밋",
    template: "%s | CrossAdmit",
  },
  description:
    "Compare university admission statistics when students are accepted to multiple universities. Korean university admission information, cross-admit statistics. 두 대학에 동시에 합격했을 때 학생들의 선택 통계를 확인하세요.",
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
    description:
      "Compare university admission statistics when students are accepted to multiple universities.",
  },
};

/** Navbar/Ticker/Footer는 루트 layout의 SiteChrome에서 한 번만 렌더링 */
export default function EnLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
