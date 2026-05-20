import { createClient } from "@supabase/supabase-js";
import type { YouTubeVideo } from "../../scripts/sources/types";
import type { Database } from "../supabase/types";
import { videoUrl } from "../../scripts/sources/youtube-studyinkorea";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }
  return createClient<Database>(url, key);
}

export type VideoLanguage = "en" | "ko" | "other";
export type VideoContentType =
  | "vlog"
  | "advice"
  | "tour"
  | "review"
  | "general";

/** 한국어 제목이면 ko, 라틴 위주면 en, 그 외 other */
export function detectVideoLanguage(title: string): VideoLanguage {
  const t = title.trim();
  if (/[\u3131-\u318E\uAC00-\uD7A3]/.test(t)) return "ko";
  if (/[a-zA-Z]/.test(t) && !/[\u3131-\u318E\uAC00-\uD7A3]/.test(t)) return "en";
  return "other";
}

const VLOG_PAT =
  /vlog|day in my life|브이로그|a day in/i;
const ADVICE_PAT =
  /advice|tips|guide|방법|팁|how to/i;
const TOUR_PAT = /tour|campus|캠퍼스/i;
const REVIEW_PAT = /review|experience|후기|경험/i;

export function detectVideoContentType(
  title: string,
  description: string
): VideoContentType {
  const text = `${title} ${description}`.toLowerCase();
  if (VLOG_PAT.test(text)) return "vlog";
  if (ADVICE_PAT.test(text)) return "advice";
  if (TOUR_PAT.test(text)) return "tour";
  if (REVIEW_PAT.test(text)) return "review";
  return "general";
}

export interface SaveVideosResult {
  saved: number;
  failed: number;
}

type UniversityVideoRow =
  Database["public"]["Tables"]["university_videos"]["Insert"];

/**
 * university_videos에 upsert합니다 (video_id 충돌 시 갱신).
 */
export async function upsertUniversityVideos(
  rows: UniversityVideoRow[]
): Promise<SaveVideosResult> {
  if (rows.length === 0) return { saved: 0, failed: 0 };

  const supabase = getSupabaseAdmin();
  let saved = 0;
  let failed = 0;

  for (const row of rows) {
    const { error } = await supabase.from("university_videos").upsert(row, {
      onConflict: "video_id",
    });
    if (error) {
      console.error(`[save-videos] upsert ${row.video_id}:`, error.message);
      failed++;
    } else {
      saved++;
    }
  }

  return { saved, failed };
}

/**
 * YouTubeVideo 배열 + 메타로 DB 행 생성 후 저장
 */
export async function saveYouTubeVideosToTable(
  items: Array<{
    video: YouTubeVideo;
    university_tags: string[];
    language: VideoLanguage;
    content_type: VideoContentType;
  }>
): Promise<SaveVideosResult> {
  const rows: UniversityVideoRow[] = items.map(
    ({ video, university_tags, language, content_type }) => ({
      video_id: video.videoId,
      title: video.title,
      description: video.description || null,
      channel_name: video.channelTitle,
      channel_id: null,
      thumbnail_url: video.thumbnailUrl || null,
      view_count: video.viewCount ?? 0,
      published_at: video.publishedAt || null,
      duration_seconds: null,
      source_url: videoUrl(video.videoId),
      language,
      content_type,
      university_tags: university_tags.length ? university_tags : [],
    })
  );

  return upsertUniversityVideos(rows);
}

/** 스크래퍼에서 중복 스킵용: 후보 URL 중 이미 university_videos에 있는 것 */
export async function getExistingUniversityVideoSourceUrls(
  candidateUrls: string[]
): Promise<Set<string>> {
  if (candidateUrls.length === 0) return new Set();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("university_videos")
    .select("source_url")
    .in("source_url", candidateUrls);

  const out = new Set<string>();
  if (error) {
    console.error("[save-videos] existing URL lookup:", error.message);
    return out;
  }
  for (const row of data ?? []) {
    if (row.source_url) out.add(row.source_url);
  }
  return out;
}
