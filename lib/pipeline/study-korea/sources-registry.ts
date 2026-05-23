/** Furniblog-style source registry for admin + master cron */

export type SourceStatus = "active" | "config_required" | "unavailable";

export type StudyKoreaSourceMeta = {
  id: string;
  label: string;
  color: string;
  status: SourceStatus;
  /** Run 버튼용 (active만) */
  cronPath?: string;
  statusLabel?: string;
  note?: string;
  requiresEnv?: string[];
};

export const STUDY_KOREA_SOURCE_META: StudyKoreaSourceMeta[] = [
  {
    id: "youtube",
    label: "YouTube (videos only)",
    cronPath: "/api/cron/scrape-youtube-study-korea",
    color: "bg-red-100 text-red-800",
    status: "active",
    note: "university_videos 테이블만",
  },
  {
    id: "reddit",
    label: "Reddit",
    cronPath: "/api/cron/scrape-reddit-study-korea",
    color: "bg-orange-100 text-orange-800",
    status: "active",
    note: "공개 RSS · OAuth 불필요",
  },
  {
    id: "quora",
    label: "Quora",
    color: "bg-blue-100 text-blue-800",
    status: "unavailable",
    statusLabel: "JS 렌더링 - 지원 불가",
  },
  {
    id: "studyinkorea",
    label: "Study in Korea (gov)",
    color: "bg-teal-100 text-teal-800",
    status: "unavailable",
    statusLabel: "HTML 파싱 불가 — 비활성화",
  },
  {
    id: "university_official",
    label: "University intl",
    cronPath: "/api/cron/scrape-universities-intl",
    color: "bg-purple-100 text-purple-800",
    status: "active",
  },
  {
    id: "naver_blog",
    label: "Naver Blog",
    cronPath: "/api/cron/scrape-naver-study-korea",
    color: "bg-green-100 text-green-800",
    status: "active",
    requiresEnv: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
  },
  {
    id: "naver_news",
    label: "Naver News",
    cronPath: "/api/cron/scrape-naver-news",
    color: "bg-emerald-100 text-emerald-800",
    status: "active",
    requiresEnv: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
  },
  {
    id: "naver_webkr_admissions",
    label: "Naver webkr (합격 후기)",
    cronPath: "/api/cron/scrape-admissions",
    color: "bg-violet-100 text-violet-800",
    status: "active",
    requiresEnv: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
    note: "디시/블로그/카페 합격 후기 → 검토 대기",
  },
];

export type StudyKoreaSourceId = (typeof STUDY_KOREA_SOURCE_META)[number]["id"];

export function getRunnableSources(): StudyKoreaSourceMeta[] {
  return STUDY_KOREA_SOURCE_META.filter(
    (s) => s.status === "active" && s.cronPath
  );
}

export function getSourceCardBorder(status: SourceStatus): string {
  switch (status) {
    case "active":
      return "border-2 border-green-400";
    case "config_required":
      return "border-2 border-amber-400";
    case "unavailable":
      return "border-2 border-slate-300 opacity-75";
  }
}
