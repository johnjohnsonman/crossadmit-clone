import type { ProcessedAdmission } from "../../scripts/sources/types";
import {
  fetchYouTubeStudyInKoreaVideos,
  videoUrl,
} from "../../scripts/sources/youtube-studyinkorea";
import { recordPipelineRun } from "./pipeline-runs";
import { getExistingYouTubeSourceUrls, saveAdmissions } from "./save";
import {
  detectVideoContentType,
  detectVideoLanguage,
  getExistingUniversityVideoSourceUrls,
  saveYouTubeVideosToTable,
} from "./save-videos";

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

function detectUniversity(title: string, description: string): string | null {
  const text = (title + " " + description).toLowerCase();
  if (
    text.includes("seoul national") ||
    text.includes("snu") ||
    text.includes("서울대")
  ) {
    return "Seoul National University";
  }
  if (text.includes("yonsei") || text.includes("연세")) return "Yonsei University";
  if (text.includes("korea university") || text.includes("고려대")) {
    return "Korea University";
  }
  if (text.includes("kaist")) return "KAIST";
  if (
    text.includes("sungkyunkwan") ||
    text.includes("skku") ||
    text.includes("성균관")
  ) {
    return "Sungkyunkwan University";
  }
  if (text.includes("sogang") || text.includes("서강")) return "Sogang University";
  if (text.includes("hanyang") || text.includes("한양")) return "Hanyang University";
  if (text.includes("ewha") || text.includes("이화")) return "Ewha Womans University";
  if (text.includes("hongik") || text.includes("홍익")) return "Hongik University";
  if (
    text.includes("language institute") ||
    text.includes("어학당") ||
    text.includes("topik")
  ) {
    return "Language School";
  }
  return null;
}

/**
 * YouTube 한국 유학 콘텐츠 수집 → 규칙 기반 처리 → Supabase 저장
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
  const existingVideoUrls = await getExistingUniversityVideoSourceUrls(urls);

  const newVideos = videos.filter((v) => {
    const url = videoUrl(v.videoId);
    if (existingUrls.has(url) || existingVideoUrls.has(url)) {
      skipped++;
      return false;
    }
    return true;
  });

  const admissions: ProcessedAdmission[] = [];
  const videoRows: Array<{
    video: (typeof videos)[number];
    university_tags: string[];
    language: ReturnType<typeof detectVideoLanguage>;
    content_type: ReturnType<typeof detectVideoContentType>;
  }> = [];

  for (const video of newVideos) {
    try {
      const uni = detectUniversity(video.title, video.description);
      // TODO: Claude 분석 나중에 추가
      // const result = await analyzeYouTubeVideo(video);
      const result: ProcessedAdmission = {
        university_en: uni ?? "Korea (General)",
        summary: video.title,
        raw_content: `${video.title}\n\n${video.description}`.slice(0, 500),
        relevance_score: 0.8,
        published: true,
        source: "youtube",
        source_url: videoUrl(video.videoId),
        source_author: video.channelTitle,
        original_language: "en",
        status: "경험공유",
        pros: [],
        cons: [],
        tips: [],
      };

      admissions.push(result);
      videoRows.push({
        video,
        university_tags: [uni ?? "Korea (General)"],
        language: detectVideoLanguage(video.title),
        content_type: detectVideoContentType(video.title, video.description),
      });
      console.log(`[youtube] ok ${video.videoId} → ${uni ?? "Korea (General)"}`);
    } catch (error) {
      failed++;
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${video.videoId}: ${msg}`);
      console.error(`[youtube] fail ${video.videoId}:`, msg);
    }
  }

  const saveResult = await saveAdmissions(admissions);
  const videoSaveResult = await saveYouTubeVideosToTable(videoRows);

  skipped += saveResult.skipped;
  failed += saveResult.failed + videoSaveResult.failed;

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
