import { normalizeStudyKoreaCategory } from "@/lib/pipeline/study-korea/categories";
import { normalizePostCategory } from "./reddit-categories";

/** PostgREST `.or()` filter for forum category tabs (category + legacy aliases). */
export function buildForumCategoryOrFilter(categoryParam: string): string {
  const raw = categoryParam.trim().toLowerCase();
  const canonical = normalizePostCategory(raw, null);
  const parts = new Set<string>([
    `category.eq.${canonical}`,
    `subcategory.eq.${canonical}`,
  ]);

  if (raw === "life") {
    parts.add("subcategory.eq.life");
  }
  if (raw === "cost" || canonical === "living_cost") {
    parts.add("category.eq.cost");
    parts.add("subcategory.eq.cost");
  }
  if (raw === "campus") {
    parts.add("category.eq.campus_life");
  }

  return [...parts].join(",");
}

export function normalizeCategoryQueryParam(
  categoryParam: string
): string {
  const raw = categoryParam.trim().toLowerCase();
  if (raw === "life" || raw === "cost" || raw === "campus") {
    return raw;
  }
  return normalizeStudyKoreaCategory(raw);
}
