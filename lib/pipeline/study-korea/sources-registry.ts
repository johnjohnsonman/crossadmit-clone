/** Furniblog-style source registry for admin + master cron */
export const STUDY_KOREA_SOURCE_META = [
  {
    id: "youtube",
    label: "YouTube",
    cronPath: "/api/cron/scrape-youtube-study-korea",
    color: "bg-red-100 text-red-800",
  },
  {
    id: "reddit",
    label: "Reddit",
    cronPath: "/api/cron/scrape-reddit-study-korea",
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "quora",
    label: "Quora",
    cronPath: "/api/cron/scrape-quora-study-korea",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "studyinkorea",
    label: "Study in Korea (gov)",
    cronPath: "/api/cron/scrape-studyinkorea",
    color: "bg-teal-100 text-teal-800",
  },
  {
    id: "university_official",
    label: "University intl",
    cronPath: "/api/cron/scrape-universities-intl",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "naver_blog",
    label: "Naver Blog",
    cronPath: "/api/cron/scrape-naver-study-korea",
    color: "bg-green-100 text-green-800",
    requiresEnv: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
  },
] as const;

export type StudyKoreaSourceId =
  (typeof STUDY_KOREA_SOURCE_META)[number]["id"];
