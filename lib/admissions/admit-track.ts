/** 합격DB admit_track 분류 (dual-audience) */

export const ADMIT_TRACK_VALUES = [
  "regular_kr",
  "overseas_kr",
  "international",
  "gks",
  "graduate",
  "abroad",
  "unknown",
] as const;

export type AdmitTrack = (typeof ADMIT_TRACK_VALUES)[number];

export const SOURCE_TYPE_VALUES = [
  "mysql_original",
  "reddit",
  "quora",
  "studyinkorea",
  "university_intl",
  "user_submitted",
] as const;

export type SourceType = (typeof SOURCE_TYPE_VALUES)[number];

/** 영어 모드 기본 필터 (국제·GKS·재외) */
export const EN_DEFAULT_ADMIT_TRACKS: AdmitTrack[] = [
  "international",
  "gks",
  "overseas_kr",
];

export function isAdmitTrack(v: string): v is AdmitTrack {
  return (ADMIT_TRACK_VALUES as readonly string[]).includes(v);
}

export function parseAdmitTrackList(raw: string | null | undefined): AdmitTrack[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is AdmitTrack => isAdmitTrack(s));
}

export const ADMIT_TRACK_FILTER_OPTIONS: {
  value: AdmitTrack | "all";
  ko: string;
  en: string;
}[] = [
  { value: "all", ko: "전체", en: "All" },
  { value: "regular_kr", ko: "국내 정시/수시", en: "Regular" },
  { value: "overseas_kr", ko: "재외국민", en: "Overseas Korean" },
  { value: "international", ko: "외국인 전형", en: "International" },
  { value: "gks", ko: "GKS", en: "GKS" },
  { value: "graduate", ko: "대학원", en: "Graduate" },
  { value: "abroad", ko: "해외 진학", en: "Abroad" },
];

export const ADMIT_TRACK_LABEL: Record<
  AdmitTrack,
  { ko: string; en: string }
> = {
  regular_kr: { ko: "국내 정시/수시", en: "Regular" },
  overseas_kr: { ko: "재외국민", en: "Overseas Korean" },
  international: { ko: "외국인 전형", en: "International" },
  gks: { ko: "GKS", en: "GKS" },
  graduate: { ko: "대학원", en: "Graduate" },
  abroad: { ko: "해외 진학", en: "Abroad" },
  unknown: { ko: "미분류", en: "Unknown" },
};

export const ADMIT_TRACK_BADGE_CLASS: Record<AdmitTrack, string> = {
  regular_kr: "bg-gray-800 text-gray-300 border-gray-700",
  overseas_kr: "bg-[#E0F2F1] text-teal-900 border-teal-200",
  international: "bg-[#FFF3E0] text-orange-900 border-orange-200",
  gks: "bg-[#F3E5F5] text-purple-900 border-purple-200",
  graduate: "bg-[#E3F2FD] text-blue-900 border-blue-200",
  abroad: "bg-[#FFF9C4] text-yellow-900 border-yellow-300",
  unknown: "bg-gray-800/80 text-gray-400 border-gray-700",
};

export function admitTrackLabel(
  track: AdmitTrack | string | undefined | null,
  locale: "ko" | "en"
): string {
  if (!track || !isAdmitTrack(track)) {
    return locale === "en" ? "Unknown" : "미분류";
  }
  return ADMIT_TRACK_LABEL[track][locale];
}
