/** 포럼 탭 = subcategory */
export const FORUM_TABS = [
  { id: "all", label: "전체" },
  { id: "admission", label: "입시정보" },
  { id: "scholarship", label: "장학금" },
  { id: "dormitory", label: "기숙사" },
  { id: "visa", label: "비자" },
  { id: "life", label: "생활" },
  { id: "language", label: "어학" },
] as const;

export const FORUM_TABS_EN = [
  { id: "all", label: "All" },
  { id: "admission", label: "Admissions" },
  { id: "scholarship", label: "Scholarship" },
  { id: "dormitory", label: "Dormitory" },
  { id: "visa", label: "Visa" },
  { id: "life", label: "Life" },
  { id: "language", label: "Language" },
] as const;

export const FORUM_UNIVERSITY_OPTIONS = [
  { slug: "", label: "전체 대학" },
  { slug: "snu", label: "서울대" },
  { slug: "yonsei", label: "연세대" },
  { slug: "korea_univ", label: "고려대" },
  { slug: "kaist", label: "KAIST" },
  { slug: "skku", label: "성균관대" },
  { slug: "hanyang", label: "한양대" },
  { slug: "other", label: "기타" },
] as const;

export const SOURCE_LABELS: Record<string, string> = {
  naver_blog: "네이버",
  naver_news: "네이버뉴스",
  reddit: "Reddit",
  quora: "Quora",
  studyinkorea: "공식",
  university_official: "공식",
};

export const SOURCE_BADGE_CLASS: Record<string, string> = {
  naver_blog: "bg-green-100 text-green-800",
  naver_news: "bg-emerald-100 text-emerald-800",
  reddit: "bg-orange-100 text-orange-800",
  quora: "bg-blue-100 text-blue-800",
  studyinkorea: "bg-teal-100 text-teal-800",
  university_official: "bg-purple-100 text-purple-800",
};

export const SUBCATEGORY_LABELS: Record<string, string> = {
  admission: "입시정보",
  scholarship: "장학금",
  dormitory: "기숙사",
  visa: "비자",
  life: "생활",
  language: "어학",
  general: "일반",
};

export const SUBCATEGORY_LABELS_EN: Record<string, string> = {
  admission: "Admissions",
  scholarship: "Scholarship",
  dormitory: "Dormitory",
  visa: "Visa",
  life: "Life",
  language: "Language",
  general: "General",
};

export function forumTabsForLocale(locale: "ko" | "en") {
  return locale === "en" ? FORUM_TABS_EN : FORUM_TABS;
}

export function subcategoryLabel(
  sub: string,
  locale: "ko" | "en"
): string {
  const map = locale === "en" ? SUBCATEGORY_LABELS_EN : SUBCATEGORY_LABELS;
  return map[sub] ?? sub;
}

/** slug → DB name 검색 키워드 */
export const SLUG_NAME_HINTS: Record<string, string[]> = {
  snu: ["서울대", "Seoul National", "SNU"],
  yonsei: ["연세", "Yonsei"],
  korea_univ: ["고려", "Korea University"],
  kaist: ["KAIST", "카이스트"],
  skku: ["성균관", "Sungkyunkwan", "SKKU"],
  hanyang: ["한양", "Hanyang"],
  sogang: ["서강", "Sogang"],
  ewha: ["이화", "Ewha"],
  unist: ["UNIST", "울산과학기술원"],
  dgist: ["DGIST", "대구경북과학기술원"],
};
