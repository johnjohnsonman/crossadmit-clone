import StudyForumBoard from "@/components/forum/StudyForumBoard";

export const metadata = {
  title: "유학 포럼 | CrossAdmit",
  description: "Study in Korea forum — Naver, Reddit, Quora, official sources",
};

export default function ForumPage() {
  return <StudyForumBoard locale="ko" />;
}
