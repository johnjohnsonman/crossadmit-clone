/** Forum UI/API에서 숨김 (DB 레코드는 유지) */
export const FORUM_EXCLUDED_CATEGORY_IDS = new Set(["youtube"]);

export const FORUM_EXCLUDED_SOURCE_IDS = new Set(["youtube"]);

export function isForumExcludedCategory(
  id: string | null | undefined
): boolean {
  if (!id) return false;
  return FORUM_EXCLUDED_CATEGORY_IDS.has(id.trim().toLowerCase());
}

export function isForumExcludedPost(row: {
  category?: string | null;
  subcategory?: string | null;
  source?: string | null;
}): boolean {
  const source = row.source?.trim().toLowerCase();
  return (
    isForumExcludedCategory(row.category) ||
    isForumExcludedCategory(row.subcategory) ||
    (source != null && FORUM_EXCLUDED_SOURCE_IDS.has(source))
  );
}

/** Supabase query: study_korea_posts에서 포럼·유학가이드 목록 제외 */
export function applyForumPostExclusions<Q>(query: Q): Q {
  return (query as { neq: (col: string, val: string) => Q })
    .neq("category", "youtube")
    .neq("subcategory", "youtube")
    .neq("source", "youtube");
}
