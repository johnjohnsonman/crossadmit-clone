import { fetchSubredditPosts } from "../../scripts/sources/reddit-base";
import { processPosts } from "./processor";
import { saveAdmissions } from "./save";

export const SUBREDDIT = "studyinkorea";
export const SOURCE_LABEL = "reddit/studyinkorea";

export interface ScrapeStudyInKoreaOptions {
  limit?: number;
  sort?: "new" | "hot" | "top";
}

export interface ScrapeStudyInKoreaResult {
  collected: number;
  processed: number;
  saved: number;
  skipped: number;
  failed: number;
  duration_ms: number;
  sample_titles: string[];
  errors?: string[];
}

/**
 * r/studyinkorea 스크래핑 → Claude 처리 → Supabase 저장 파이프라인
 */
export async function scrapeStudyInKorea(
  options: ScrapeStudyInKoreaOptions = {}
): Promise<ScrapeStudyInKoreaResult> {
  const start = Date.now();
  const limit = options.limit ?? 25;
  const sort = options.sort ?? "new";
  const errors: string[] = [];

  const posts = await fetchSubredditPosts(SUBREDDIT, { sort, limit });

  const textPosts = posts.filter(
    (p) => p.selftext.length > 50 || p.title.length > 20
  );

  const { processed, skipped, failed } = await processPosts(textPosts, {
    source: SOURCE_LABEL,
    minRelevance: 0.4,
    delayMs: 800,
  });

  const saveResult = await saveAdmissions(processed);

  if (failed > 0) {
    errors.push(`${failed} post(s) failed during Claude processing`);
  }
  if (saveResult.failed > 0) {
    errors.push(`${saveResult.failed} record(s) failed during Supabase save`);
  }

  return {
    collected: posts.length,
    processed: textPosts.length,
    saved: saveResult.inserted,
    skipped: skipped + saveResult.skipped,
    failed: failed + saveResult.failed,
    duration_ms: Date.now() - start,
    sample_titles: posts.slice(0, 5).map((p) => p.title),
    ...(errors.length > 0 ? { errors } : {}),
  };
}
