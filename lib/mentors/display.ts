import type { Locale } from "@/lib/i18n/dictionary";
import type { MentorRow, MentorTagLink } from "./types";

export function mentorUniversityName(m: MentorRow, locale: Locale): string {
  if (m.university) {
    return locale === "en"
      ? m.university.name_en || m.university.name_kr
      : m.university.name_kr || m.university.name_en;
  }
  return m.university_name_freetext || (locale === "en" ? "See bio" : "자기소개 참고");
}

export function mentorStudentStatusLabel(
  status: string | null,
  locale: Locale
): string {
  if (status === "graduated") return locale === "en" ? "Graduated" : "졸업";
  if (status === "enrolled") return locale === "en" ? "Enrolled" : "재학";
  if (status === "leave") return locale === "en" ? "On leave" : "휴학";
  return "";
}

export function mentorTagsFlat(m: MentorRow): NonNullable<MentorTagLink["tag"]>[] {
  return (m.tags ?? [])
    .map((t) => t.tag)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
}

export function tagTypeLabel(type: number, locale: Locale): string {
  const map: Record<number, [string, string]> = {
    1: ["미팅 방식", "Meeting"],
    2: ["장소", "Location"],
    3: ["입시", "Admission"],
    4: ["커리어", "Career"],
  };
  const pair = map[type] ?? ["기타", "Other"];
  return locale === "en" ? pair[1] : pair[0];
}

export function mentorMinPriceUsd(m: MentorRow): number {
  const prices: number[] = [];
  if (m.offers_admission && Number(m.price_admission_usd) > 0) {
    prices.push(Number(m.price_admission_usd));
  }
  if (m.offers_career && Number(m.price_career_usd) > 0) {
    prices.push(Number(m.price_career_usd));
  }
  return prices.length ? Math.min(...prices) : 0;
}

export function isMentorFree(m: MentorRow): boolean {
  return !m.offers_admission && !m.offers_career;
}
