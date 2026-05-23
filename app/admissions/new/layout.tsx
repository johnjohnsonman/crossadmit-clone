import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "합격 후기 등록 | 크로스어드밋",
  description:
    "로그인 없이 한국 대학 합격 후기를 등록할 수 있습니다. 등록 즉시 합격DB에 공개됩니다.",
};

export default function AdmissionNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
