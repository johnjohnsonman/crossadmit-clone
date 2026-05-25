/** 합격DB degree_level — 학위 단계 (학부/석박사/MBA/로스쿨) */

export const DEGREE_LEVEL_VALUES = [
  "undergraduate",
  "graduate",
  "mba",
  "law",
  "unknown",
] as const;

export type DegreeLevel = (typeof DEGREE_LEVEL_VALUES)[number];

export function isDegreeLevel(v: string): v is DegreeLevel {
  return (DEGREE_LEVEL_VALUES as readonly string[]).includes(v);
}

/** 목록/필터용 (undergraduate·unknown 제외) */
export const DEGREE_LEVEL_FILTER_VALUES = [
  "graduate",
  "mba",
  "law",
] as const;

export type DegreeLevelFilterValue = "all" | DegreeLevel;

export const DEGREE_LEVEL_FILTER_OPTIONS: {
  value: DegreeLevelFilterValue;
  ko: string;
  en: string;
}[] = [
  { value: "all", ko: "전체", en: "All" },
  { value: "undergraduate", ko: "학부", en: "Undergraduate" },
  { value: "graduate", ko: "대학원 (석박사)", en: "Graduate" },
  { value: "mba", ko: "MBA", en: "MBA" },
  { value: "law", ko: "로스쿨", en: "Law" },
];

export const DEGREE_LEVEL_BADGE_CLASS: Record<
  "graduate" | "mba" | "law",
  string
> = {
  graduate: "bg-blue-50 text-blue-800 border-blue-200",
  mba: "bg-purple-50 text-purple-800 border-purple-200",
  law: "bg-teal-50 text-teal-800 border-teal-200",
};

export const DEGREE_LEVEL_LABEL: Record<
  DegreeLevel,
  { ko: string; en: string }
> = {
  undergraduate: { ko: "학부", en: "Undergraduate" },
  graduate: { ko: "대학원", en: "Graduate" },
  mba: { ko: "MBA", en: "MBA" },
  law: { ko: "로스쿨", en: "Law" },
  unknown: { ko: "미분류", en: "Unknown" },
};

export function parseDegreeLevelList(
  raw: string | null | undefined
): DegreeLevel[] {
  if (!raw?.trim() || raw === "all") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is DegreeLevel => isDegreeLevel(s));
}

export function degreeLevelLabel(
  level: DegreeLevel | string | null | undefined,
  locale: "ko" | "en"
): string {
  if (!level || !isDegreeLevel(level)) {
    return locale === "en" ? "Unknown" : "미분류";
  }
  return DEGREE_LEVEL_LABEL[level][locale];
}

/** undergraduate·unknown은 배지 숨김 */
export function shouldShowDegreeBadge(
  level: DegreeLevel | string | null | undefined
): level is "graduate" | "mba" | "law" {
  return level === "graduate" || level === "mba" || level === "law";
}
