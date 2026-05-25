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
  {
    id: "yonsei_uic",
    label: "Yonsei UIC interviews",
    cronPath: "/api/cron/scrape-yonsei-uic",
    color: "bg-indigo-100 text-indigo-800",
    status: "active",
    note: "UIC [Student Interview] 공식 시리즈 → admissions 라우팅",
  },
  {
    id: "ku_insights",
    label: "KU Insights",
    cronPath: "/api/cron/scrape-ku-insights",
    color: "bg-fuchsia-100 text-fuchsia-800",
    status: "active",
    note: "Korea University 공식 국제학생 인터뷰/캠퍼스 스토리 → admissions 라우팅",
  },
  {
    id: "skku_foreign",
    label: "SKKU International",
    cronPath: "/api/cron/scrape-skku-foreign",
    color: "bg-blue-100 text-blue-800",
    status: "active",
    note: "성균웹진 외국인의 성대생활 → admissions 라우팅",
  },
  {
    id: "sogang_foreign",
    label: "Sogang International",
    cronPath: "/api/cron/scrape-sogang-foreign",
    color: "bg-pink-100 text-pink-800",
    status: "active",
    note: "Sogang GSIS My Sogang GSIS → admissions 라우팅",
  },
  {
    id: "kangwon_foreign",
    label: "Kangwon Student of Month",
    cronPath: "/api/cron/scrape-kangwon-foreign",
    color: "bg-cyan-100 text-cyan-800",
    status: "active",
    note: "강원대 Student of the Month → admissions 라우팅",
  },
  {
    id: "pusan_foreign",
    label: "Pusan International",
    cronPath: "/api/cron/scrape-pusan-foreign",
    color: "bg-emerald-100 text-emerald-800",
    status: "active",
    note: "Channel PNU PMI 국제학생 시리즈 → admissions 라우팅",
  },
  {
    id: "chungbuk_foreign",
    label: "Chungbuk CBNU People",
    color: "bg-slate-100 text-slate-700",
    status: "unavailable",
    statusLabel: "robots.txt blocks User-agent:*",
    note: "oia.cbnu.ac.kr robots.txt 차단으로 스킵",
  },
  {
    id: "kwangwoon_foreign",
    label: "Kwangwoon Alumni Relay",
    cronPath: "/api/cron/scrape-kwangwoon-foreign",
    color: "bg-violet-100 text-violet-800",
    status: "active",
    note: "광운대 국제졸업생 인터뷰 보드 → admissions 라우팅",
  },
  {
    id: "ajou_foreign",
    label: "Ajou Foreign Interviews",
    cronPath: "/api/cron/scrape-ajou-foreign",
    color: "bg-yellow-100 text-yellow-800",
    status: "active",
    note: "아주대 글로벌경영 외국인 교환학생 인터뷰 → admissions 라우팅",
  },
  {
    id: "kaist_herald",
    label: "KAIST Herald interviews",
    cronPath: "/api/cron/scrape-kaist-herald",
    color: "bg-sky-100 text-sky-800",
    status: "active",
    note: "Herald Interview/International 기사 → admissions 라우팅",
  },
  {
    id: "korea_net_gks",
    label: "Korea.net GKS interviews",
    cronPath: "/api/cron/scrape-korea-net-gks",
    color: "bg-amber-100 text-amber-800",
    status: "active",
    requiresEnv: ["HONORARY_REPORTERS_PASS_KEY"],
    note: "Honorary Reporters GKS 검색 · passKey 필요",
  },
  {
    id: "study_korea_news",
    label: "Study Korea News",
    cronPath: "/api/cron/scrape-study-korea-news",
    color: "bg-lime-100 text-lime-800",
    status: "active",
    note: "studykoreanews.com 영문·GKS·인터뷰 → admissions 라우팅",
  },
  {
    id: "gradcafe",
    label: "GradCafe (PhD/MS)",
    cronPath: "/api/cron/scrape-gradcafe",
    color: "bg-rose-100 text-rose-800",
    status: "active",
    note: "thegradcafe.com 한국 대학 석박사 합격 결과 → graduate 트랙",
  },
  {
    id: "duhoc_vn",
    label: "Duhoc Vietnam (베트남 유학)",
    cronPath: "/api/cron/scrape-duhoc-vn",
    color: "bg-red-100 text-red-800",
    status: "active",
    note: "베트남 유학 에이전시 학생 후기 → 다국어 admissions 라우팅",
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
