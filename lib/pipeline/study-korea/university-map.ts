const UNIVERSITY_PATTERNS: { slug: string; patterns: RegExp[] }[] = [
  { slug: "snu", patterns: [/seoul national/i, /\bsnu\b/i, /서울대/] },
  { slug: "yonsei", patterns: [/yonsei/i, /연세/] },
  { slug: "korea_univ", patterns: [/korea university/i, /고려대/] },
  { slug: "kaist", patterns: [/kaist/i, /카이스트/] },
  { slug: "skku", patterns: [/sungkyunkwan/i, /\bskku\b/i, /성균관/] },
  { slug: "hanyang", patterns: [/hanyang/i, /한양/] },
  { slug: "cau", patterns: [/chung-ang/i, /\bcau\b/i, /중앙대/] },
  { slug: "hku", patterns: [/hongik/i, /홍익/] },
  { slug: "ewha", patterns: [/ewha/i, /이화/] },
  { slug: "sogang", patterns: [/sogang/i, /서강/] },
];

/** Claude 추출값 + 본문에서 대학 slug 정규화 */
export function normalizeUniversitySlug(
  raw: string | null | undefined,
  fallbackText = ""
): string {
  const text = `${raw ?? ""} ${fallbackText}`.trim();
  if (!text) return "";

  for (const { slug, patterns } of UNIVERSITY_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return slug;
  }
  return "";
}
