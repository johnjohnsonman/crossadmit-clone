/** PostgREST ilike / `.or()` 필터용 검색어 정규화 */
export function escapeIlike(q: string): string {
  if (!q) return "";
  return q
    .replace(/[(),%_'"\\!&|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
