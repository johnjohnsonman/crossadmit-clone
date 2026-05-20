import type { YouTubeVideo } from "./types";

export const SEARCH_QUERIES = [
  "studying in Korea university experience",
  "foreigner studying in Korea vlog",
  "Korean university international student",
  "study abroad Korea experience",
  "한국 유학 외국인 경험",
] as const;

const MAX_RESULTS_PER_QUERY = 10;
const MIN_VIEW_COUNT = 1000;
const DESCRIPTION_MAX = 500;

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  error?: { message?: string };
}

interface YouTubeVideoItem {
  id?: string;
  statistics?: { viewCount?: string };
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[];
  error?: { message?: string };
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("YOUTUBE_API_KEY is not set in environment");
  }
  return key;
}

function oneYearAgoIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString();
}

function videoUrl(videoId: string): string {
  return `https://youtube.com/watch?v=${videoId}`;
}

async function searchQuery(
  query: string,
  publishedAfter: string,
  apiKey: string
): Promise<YouTubeSearchItem[]> {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(MAX_RESULTS_PER_QUERY),
    order: "relevance",
    publishedAfter,
    key: apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`
  );
  const json = (await response.json()) as YouTubeSearchResponse;

  if (!response.ok) {
    throw new Error(
      json.error?.message ?? `YouTube search failed: ${response.status}`
    );
  }

  return json.items ?? [];
}

async function fetchViewCounts(
  videoIds: string[],
  apiKey: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const batchSize = 50;

  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const params = new URLSearchParams({
      part: "statistics",
      id: batch.join(","),
      key: apiKey,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );
    const json = (await response.json()) as YouTubeVideosResponse;

    if (!response.ok) {
      throw new Error(
        json.error?.message ?? `YouTube videos.list failed: ${response.status}`
      );
    }

    for (const item of json.items ?? []) {
      if (item.id) {
        counts.set(item.id, parseInt(item.statistics?.viewCount ?? "0", 10));
      }
    }
  }

  return counts;
}

/**
 * YouTube Data API v3로 한국 유학 관련 영상을 수집합니다.
 */
export async function fetchYouTubeStudyInKoreaVideos(options?: {
  limit?: number;
}): Promise<YouTubeVideo[]> {
  const apiKey = getApiKey();
  const publishedAfter = oneYearAgoIso();
  const seen = new Map<string, YouTubeVideo>();

  for (const query of SEARCH_QUERIES) {
    const items = await searchQuery(query, publishedAfter, apiKey);

    for (const item of items) {
      const videoId = item.id?.videoId;
      if (!videoId || seen.has(videoId)) continue;

      const snippet = item.snippet;
      if (!snippet?.title) continue;

      seen.set(videoId, {
        videoId,
        title: snippet.title,
        description: (snippet.description ?? "").slice(0, DESCRIPTION_MAX),
        channelTitle: snippet.channelTitle ?? "Unknown",
        publishedAt: snippet.publishedAt ?? new Date().toISOString(),
        thumbnailUrl:
          snippet.thumbnails?.high?.url ??
          snippet.thumbnails?.medium?.url ??
          "",
        viewCount: 0,
      });
    }
  }

  const videoIds = [...seen.keys()];
  if (videoIds.length === 0) return [];

  const viewCounts = await fetchViewCounts(videoIds, apiKey);

  const filtered: YouTubeVideo[] = [];
  for (const video of seen.values()) {
    const views = viewCounts.get(video.videoId) ?? 0;
    if (views < MIN_VIEW_COUNT) continue;
    filtered.push({ ...video, viewCount: views });
  }

  filtered.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const cap = options?.limit ?? filtered.length;
  return filtered.slice(0, cap);
}

export { videoUrl };
