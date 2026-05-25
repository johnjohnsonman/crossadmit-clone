/** 합격기 원문 언어 코드 */

export const ORIGINAL_LANGUAGE_VALUES = [
  "en",
  "ko",
  "vi",
  "zh",
  "mn",
  "uz",
  "ne",
  "my",
  "ja",
  "ru",
  "es",
  "ar",
  "other",
] as const;

export type OriginalLanguage = (typeof ORIGINAL_LANGUAGE_VALUES)[number];

export function isOriginalLanguage(v: string): v is OriginalLanguage {
  return (ORIGINAL_LANGUAGE_VALUES as readonly string[]).includes(v);
}

export function detectOriginalLanguage(text: string): OriginalLanguage {
  if (/[가-힣]{8,}/.test(text)) return "ko";
  if (/[\u4e00-\u9fff]{6,}/.test(text)) return "zh";
  if (/[\u3040-\u30ff]{6,}/.test(text)) return "ja";
  if (/[\u0600-\u06FF]{8,}/.test(text)) return "ar";
  if (/[\u0400-\u04FF]{8,}/.test(text)) return "ru";
  if (/[ăâđêôơưĂÂĐÊÔƠƯ]/.test(text) || /\b(trúng tuyển|được nhận|được chấp nhận)\b/i.test(text)) {
    return "vi";
  }
  return "en";
}

export function normalizeOriginalLanguage(
  raw: string | null | undefined,
  fallbackText = ""
): OriginalLanguage {
  if (raw && isOriginalLanguage(raw)) return raw;
  if (fallbackText.trim()) return detectOriginalLanguage(fallbackText);
  return "en";
}
