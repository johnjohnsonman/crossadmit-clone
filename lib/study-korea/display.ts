/** study_korea_posts 표시용 (KR / EN) */

export type StudyKoreaLang = "ko" | "en";

export type PostLike = {
  title: string;
  ai_title_en?: string | null;
  ai_summary?: string | null;
  ai_summary_kr?: string | null;
  ai_summary_en?: string | null;
  ai_content_en?: string | null;
};

export function resolveStudyKoreaLang(
  locale?: string | null,
  langParam?: string | null
): StudyKoreaLang {
  if (langParam === "en" || locale === "en") return "en";
  return "ko";
}

function hasText(value?: string | null): boolean {
  return Boolean(value?.trim());
}

export function postDisplayTitle(post: PostLike, lang: StudyKoreaLang): string {
  if (lang === "en") {
    if (hasText(post.ai_title_en)) return post.ai_title_en!.trim();
    return post.title?.trim() || "";
  }
  return post.title?.trim() || "";
}

export function postDisplaySummary(
  post: PostLike,
  lang: StudyKoreaLang
): string {
  if (lang === "en") {
    if (hasText(post.ai_summary_en)) return post.ai_summary_en!.trim();
    if (hasText(post.ai_summary)) return post.ai_summary!.trim();
    if (hasText(post.ai_summary_kr)) return post.ai_summary_kr!.trim();
    return "";
  }
  if (hasText(post.ai_summary_kr)) return post.ai_summary_kr!.trim();
  return post.ai_summary?.trim() || "";
}
