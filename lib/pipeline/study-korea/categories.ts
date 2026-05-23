import type { StudyKoreaCategory, StudyKoreaSubcategory } from "./types";

/** Foreign-student-focused taxonomy */
export const STUDY_KOREA_CATEGORIES = [
  "admission",
  "scholarship",
  "visa",
  "dormitory",
  "living_cost",
  "language",
  "campus_life",
  "settlement",
  "employment",
  "culture",
  "general",
] as const;

const VALID = new Set<string>(STUDY_KOREA_CATEGORIES);

/** Legacy DB / Claude aliases → canonical category */
const LEGACY_MAP: Record<string, StudyKoreaCategory> = {
  cost: "living_cost",
  life: "culture",
  living: "culture",
  campus: "campus_life",
  work: "employment",
  job: "employment",
  jobs: "employment",
  housing: "dormitory",
  tuition: "living_cost",
  fees: "living_cost",
  topik: "language",
  korean: "language",
  enroll: "admission",
  admissions: "admission",
  입시: "admission",
  장학금: "scholarship",
  비자: "visa",
  기숙사: "dormitory",
  어학: "language",
  생활: "culture",
  일반: "general",
};

export function normalizeStudyKoreaCategory(
  raw?: string | null
): StudyKoreaCategory {
  const key = String(raw ?? "general")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (VALID.has(key)) return key as StudyKoreaCategory;
  if (LEGACY_MAP[key]) return LEGACY_MAP[key];
  return "general";
}

/** Forum subcategory (stored in DB) — aligns with public filter tabs */
export function categoryToSubcategory(
  category: StudyKoreaCategory
): StudyKoreaSubcategory {
  const map: Record<StudyKoreaCategory, StudyKoreaSubcategory> = {
    admission: "admission",
    scholarship: "scholarship",
    visa: "visa",
    dormitory: "dormitory",
    living_cost: "life",
    language: "language",
    campus_life: "life",
    settlement: "life",
    employment: "life",
    culture: "life",
    general: "general",
  };
  return map[category] ?? "general";
}
