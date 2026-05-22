import StudyKoreaGuide from "@/components/study-korea/StudyKoreaGuide";

export const metadata = {
  title: "한국 유학 가이드 | CrossAdmit",
  description: "Study in Korea tips from Reddit and YouTube",
};

export default function StudyKoreaPage() {
  return <StudyKoreaGuide locale="ko" />;
}
