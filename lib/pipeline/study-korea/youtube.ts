import { scrapeYouTubeStudyInKorea } from "@/lib/pipeline/scrape-youtube";
import type { ScrapeRunResult } from "./types";

/**
 * YouTube 수집 → university_videos (+ admissions 보조)만 저장.
 * study_korea_posts에는 저장하지 않음.
 */
export async function scrapeYoutubeStudyKorea(): Promise<ScrapeRunResult> {
  const result = await scrapeYouTubeStudyInKorea({ limit: 50 });

  return {
    collected: result.collected,
    processed: result.processed,
    saved: result.saved,
    failed: result.failed,
    skipped: result.skipped,
    routed_admissions: 0,
    routed_review: 0,
    routed_general: 0,
    errors: result.errors ?? [],
  };
}
