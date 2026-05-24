/** 크로스어드밋 비교 ID·표시명 유틸 */

export type ParsedComparisonId =
  | { kind: "ids"; univAId: number; univBId: number }
  | { kind: "legacy_keys"; keyA: string; keyB: string }
  | null;

export function parseComparisonId(raw: string): ParsedComparisonId {
  const id = decodeURIComponent(raw.trim());
  const m = /^cross-(\d+)-vs-(\d+)$/i.exec(id);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      const [low, high] = a < b ? [a, b] : [b, a];
      return { kind: "ids", univAId: low, univBId: high };
    }
  }

  const parts = id.split("-vs-");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { kind: "legacy_keys", keyA: parts[0], keyB: parts[1] };
  }
  return null;
}

export function buildComparisonSlug(univAId: number, univBId: number): string {
  const [low, high] =
    univAId < univBId ? [univAId, univBId] : [univBId, univAId];
  return `cross-${low}-vs-${high}`;
}

/** `name:esade`, `cross-name:esade` 등 내부 키 → 표시용 문자열 */
export function formatSchoolKeyLabel(
  keyOrName: string,
  locale: "ko" | "en" = "ko"
): string {
  const raw = keyOrName.trim();
  if (!raw) {
    return locale === "en" ? "Unknown school" : "등록되지 않은 학교";
  }

  if (/^cross-/i.test(raw) && raw.includes("name:")) {
    const inner = raw.replace(/^cross-/i, "");
    return formatSchoolKeyLabel(inner, locale);
  }

  if (raw.startsWith("name:")) {
    const name = raw.slice(5).trim();
    if (!name) {
      return locale === "en" ? "Unknown school" : "등록되지 않은 학교";
    }
    return name;
  }

  if (raw.startsWith("id:")) {
    return locale === "en" ? "Unknown school" : "등록되지 않은 학교";
  }

  return raw;
}

export function displayUniversityName(
  u: { name_kr: string; name_en: string },
  locale: "ko" | "en"
): string {
  if (locale === "en" && u.name_en.trim()) return u.name_en.trim();
  return u.name_kr.trim() || u.name_en.trim();
}
