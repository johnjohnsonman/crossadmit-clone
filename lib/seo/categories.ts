import type { RedditCategoryId } from "@/lib/forum/reddit-categories";

export const CATEGORY_SEO_NAMES: Record<
  RedditCategoryId | "general",
  { en: string; ko: string }
> = {
  visa: { en: "Korean Visa Information", ko: "한국 비자 정보" },
  admission: { en: "Korean University Admissions", ko: "한국 대학 입시" },
  scholarship: { en: "Korean Scholarships", ko: "한국 장학금" },
  dormitory: { en: "Korean University Dormitory", ko: "기숙사·주거" },
  language: { en: "TOPIK & Korean Language", ko: "한국어·TOPIK" },
  campus_life: { en: "Campus Life in Korea", ko: "캠퍼스 생활" },
  settlement: { en: "Settling in Korea", ko: "한국 정착·생활" },
  employment: { en: "Work & Employment in Korea", ko: "취업·알바" },
  culture: { en: "Korean Culture", ko: "문화·적응" },
  living_cost: { en: "Cost of Living in Korea", ko: "생활비·학비" },
  general: { en: "Study in Korea", ko: "한국 유학 일반" },
};

export function getCategorySeoName(category: string): { en: string; ko: string } {
  const key = category as RedditCategoryId;
  return CATEGORY_SEO_NAMES[key] ?? { en: category, ko: category };
}
