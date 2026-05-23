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

export function postDisplayTitle(post: PostLike, lang: StudyKoreaLang): string {
  if (lang === "en") {
    const en = post.ai_title_en?.trim();
    if (en) return en;
    return post.title?.trim() || "";
  }
  return post.title?.trim() || "";
}

export function postDisplaySummary(
  post: PostLike,
  lang: StudyKoreaLang
): string {
  if (lang === "en") {
    const en = post.ai_summary_en?.trim();
    if (en) return en;
    const kr = post.ai_summary_kr?.trim();
    if (kr) return kr;
    return post.ai_summary?.trim() || "";
  }
  const kr = post.ai_summary_kr?.trim();
  if (kr) return kr;
  return post.ai_summary?.trim() || "";
}
