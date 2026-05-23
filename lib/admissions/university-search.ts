/** PostgREST `.or()` 파싱을 깨뜨리는 문자 제거 후 검색어 정규화 */
export function safeSearchTerm(raw: string): string {
  return raw
    .replace(/[(),%_'"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 자동완성 라벨 `USC (University of ...)` → 검색용 약어/이름 */
export function stripAutocompleteLabel(label: string): string {
  const paren = label.indexOf("(");
  return (paren > 0 ? label.slice(0, paren) : label).trim();
}

/** ilike + PostgREST `.or()` 필터용 이스케이프 */
export function escapeIlikeForPostgrest(raw: string): string {
  const cleaned = safeSearchTerm(raw);
  return cleaned.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
