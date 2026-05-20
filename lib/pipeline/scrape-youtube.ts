import { analyzeYouTubeVideo } from "../ai/claude";
import type { ProcessedAdmission } from "../../scripts/sources/types";
import {
  fetchYouTubeStudyInKoreaVideos,
  videoUrl,
} from "../../scripts/sources/youtube-studyinkorea";
import { recordPipelineRun } from "./pipeline-runs";
import { getExistingYouTubeSourceUrls, saveAdmissions } from "./save";

export const SOURCE_LABEL = "youtube";

export interface ScrapeYouTubeOptions {
  limit?: number;
}

export interface ScrapeYouTubeResult {
  collected: number;
  processed: number;
  saved: number;
  skipped: number;
  failed: number;
  duration_ms: number;
  sample_titles: string[];
  errors?: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * YouTube 한국 유학 콘텐츠 수집 → Claude 처리 → Supabase 저장
 */
export async function scrapeYouTubeStudyInKorea(
  options: ScrapeYouTubeOptions = {}
): Promise<ScrapeYouTubeResult> {
  const start = Date.now();
  const errors: string[] = [];
  let skipped = 0;
  let failed = 0;

  const videos = await fetchYouTubeStudyInKoreaVideos({ limit: options.limit });
  const urls = videos.map((v) => videoUrl(v.videoId));
  const existingUrls = await getExistingYouTubeSourceUrls(urls);

  const newVideos = videos.filter((v) => {
    const url = videoUrl(v.videoId);
    if (existingUrls.has(url)) {
      skipped++;
      return false;
    }
    return true;
  });

  const admissions: ProcessedAdmission[] = [];

  for (const video of newVideos) {
    try {
      const result = await analyzeYouTubeVideo(video);
      if (!result) {
        skipped++;
        console.log(`[youtube] skip ${video.videoId} (low relevance)`);
      } else {
        admissions.push(result);
        console.log(
          `[youtube] ok ${video.videoId} → ${result.university_en ?? "unknown"}`
        );
      }
    } catch (error) {
      failed++;
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${video.videoId}: ${msg}`);
      console.error(`[youtube] fail ${video.videoId}:`, msg);
    }
    await sleep(800);
  }

  const saveResult = await saveAdmissions(admissions);

  skipped += saveResult.skipped;
  failed += saveResult.failed;

  const result: ScrapeYouTubeResult = {
    collected: videos.length,
    processed: newVideos.length,
    saved: saveResult.inserted,
    skipped,
    failed,
    duration_ms: Date.now() - start,
    sample_titles: videos.slice(0, 5).map((v) => v.title),
    ...(errors.length > 0 ? { errors } : {}),
  };

  const status =
    failed > 0 && saveResult.inserted === 0
      ? "failed"
      : failed > 0
        ? "partial"
        : "success";

  await recordPipelineRun({
    pipelineType: "youtube/studyinkorea",
    status,
    recordsProcessed: saveResult.inserted,
    errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
    metadata: result,
  });

  return result;
}
