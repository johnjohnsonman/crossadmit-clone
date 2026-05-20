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
  /** university_videos upsert 성공 수 (주요 지표) */
  saved: number;
  /** 이미 DB에 있어 스크랩하지 않은 수 (source_url 중복) */
  skipped: number;
  /** university_videos 저장 실패 수 */
  failed: number;
  /** admissions 테이블 저장 성공 수 (보조) */
  admissions_saved: number;
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

  const videos = await fetchYouTubeStudyInKoreaVideos({ limit: options.limit });
  const urls = videos.map((v) => videoUrl(v.videoId));
  const existingUrls = await getExistingYouTubeSourceUrls(urls);
  const existingVideoUrls = await getExistingUniversityVideoSourceUrls(urls);

  let skippedDuplicates = 0;
  const newVideos = videos.filter((v) => {
    const url = videoUrl(v.videoId);
    if (existingUrls.has(url) || existingVideoUrls.has(url)) {
      skippedDuplicates++;
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
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`build ${video.videoId}: ${msg}`);
      console.error(`[youtube] build fail ${video.videoId}:`, msg);
    }
  }

  const saveResult = await saveAdmissions(admissions);
  const videoSaveResult = await saveYouTubeVideosToTable(videoRows);

  const result: ScrapeYouTubeResult = {
    collected: videos.length,
    processed: newVideos.length,
    saved: videoSaveResult.saved,
    skipped: skippedDuplicates,
    failed: videoSaveResult.failed,
    admissions_saved: saveResult.inserted,
    duration_ms: Date.now() - start,
    sample_titles: videos.slice(0, 5).map((v) => v.title),
    ...(errors.length > 0 ? { errors } : {}),
  };

  const videoFailed = videoSaveResult.failed;
  const videoSaved = videoSaveResult.saved;

  const status =
    videoFailed > 0 && videoSaved === 0
      ? "failed"
      : videoFailed > 0
        ? "partial"
        : "success";

  await recordPipelineRun({
    pipelineType: "youtube/studyinkorea",
    status,
    recordsProcessed: videoSaved,
    errorMessage:
      errors.length > 0 || saveResult.failed > 0
        ? [
            errors.length > 0 ? errors.join("; ") : "",
            saveResult.failed > 0
              ? `admissions insert failed: ${saveResult.failed}`
              : "",
          ]
            .filter(Boolean)
            .join(" | ")
        : undefined,
    metadata: result,
  });

  return result;
}
