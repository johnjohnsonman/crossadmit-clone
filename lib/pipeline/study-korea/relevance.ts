import type { StudyKoreaAnalysis } from "./types";

/** r/studyinkorea는 한국 유학 전용 — 항상 저장 */
export function isStudyInKoreaSubreddit(subreddit?: string): boolean {
  return subreddit?.toLowerCase() === "studyinkorea";
}

/** 명백히 무관/스팸만 제외 (기본 저장) */
export function isObviouslyIrrelevant(title: string, content: string): boolean {
  const t = title.trim();
  const text = `${title} ${content}`.trim();

  if (text.length < 10) return true;
  if (/^\[?(removed|deleted)\]?$/i.test(t)) return true;
  if (/^(test|spam|null)$/i.test(t)) return true;

  return false;
}

/** DB 저장 여부: 스팸/빈 글만 제외. 무관 콘텐츠는 is_published=false로 저장 */
export function shouldSavePost(
  _subreddit: string | undefined,
  title: string,
  content: string,
  _analysis: StudyKoreaAnalysis
): boolean {
  if (isObviouslyIrrelevant(title, content)) return false;
  return true;
}

export function fillEmptySummaries(
  title: string,
  content: string,
  analysis: StudyKoreaAnalysis
): StudyKoreaAnalysis {
  const fallbackEn =
    analysis.ai_summary ||
    (content.trim()
      ? content.trim().slice(0, 300)
      : `Discussion: ${title}`.slice(0, 300));
  const fallbackKr =
    analysis.ai_summary_kr ||
    (content.trim()
      ? content.trim().slice(0, 300)
      : `게시글: ${title}`.slice(0, 300));
  const fallbackTitleEn = analysis.ai_title_en || title.slice(0, 200);
  const fallbackSummaryEn = analysis.ai_summary_en || fallbackEn;

  return {
    ...analysis,
    ai_summary: fallbackEn,
    ai_summary_kr: fallbackKr,
    ai_title_en: fallbackTitleEn,
    ai_summary_en: fallbackSummaryEn,
    ai_content_en: analysis.ai_content_en ?? "",
  };
}
