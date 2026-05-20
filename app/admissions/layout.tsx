import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "합격DB | 크로스어드밋",
  description:
    "합격 스펙 및 후기를 공유하고 볼 수 있습니다. 주요 대학 합격자 스펙과 입시 후기를 확인하세요.",
  keywords: [
    "합격DB",
    "합격 후기",
    "입시 정보",
    "대학 합격",
    "합격 스펙",
    "유학 한국",
  ],
  openGraph: {
    title: "합격DB | 크로스어드밋",
    description:
      "합격 스펙 및 후기를 공유하고 볼 수 있습니다.",
    type: "website",
    url: "https://crossadmit.com/admissions",
  },
};

export default function AdmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
