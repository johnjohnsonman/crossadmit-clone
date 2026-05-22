import { analyzeStudyKoreaContent } from "./claude";
import { finishPipelineRun, startPipelineRun } from "./runs";
import { upsertStudyKoreaPost } from "./save";
import type { ScrapeRunResult } from "./types";
import { normalizeUniversitySlug } from "./university-map";

export const YOUTUBE_SEARCH_QUERIES = [
  "study in Korea university experience",
  "Korean university vlog international student",
  "studying in Seoul vlog",
  "TOPIK exam tips",
  "Korea university scholarship GKS",
  "living in Korea as a student",
  "SNU Yonsei Korea University international",
];

interface YtSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
  };
}

interface YtVideoDetail {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    tags?: string[];
  };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
}

function ytKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  return key;
}

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  url.searchParams.set("key", ytKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = (await res.json()) as T & {
    error?: { errors?: { reason?: string }[]; message?: string };
  };
  const reason = json.error?.errors?.[0]?.reason;
  if (reason === "quotaExceeded") {
    const err = new Error("YouTube quota exceeded") as Error & { quota?: boolean };
    err.quota = true;
    throw err;
  }
  if (!res.ok) {
    throw new Error(json.error?.message ?? `YouTube API ${res.status}`);
  }
  return json;
}

async function searchVideos(query: string): Promise<YtSearchItem[]> {
  const data = await ytFetch<{ items?: YtSearchItem[] }>("search", {
    part: "snippet",
    type: "video",
    q: query,
    maxResults: "10",
    relevanceLanguage: "en",
  });
  return data.items ?? [];
}

async function videoDetails(ids: string[]): Promise<YtVideoDetail[]> {
  if (!ids.length) return [];
  const data = await ytFetch<{ items?: YtVideoDetail[] }>("videos", {
    part: "snippet,statistics",
    id: ids.join(","),
  });
  return data.items ?? [];
}

export async function scrapeYoutubeStudyKorea(): Promise<ScrapeRunResult> {
  const runId = await startPipelineRun(
    "youtube",
    YOUTUBE_SEARCH_QUERIES.join(" | ")
  );
  const result: ScrapeRunResult = {
    collected: 0,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const videoMap = new Map<string, YtVideoDetail>();

  try {
    for (const query of YOUTUBE_SEARCH_QUERIES) {
      try {
        const items = await searchVideos(query);
        const ids = items
          .map((i) => i.id?.videoId)
          .filter((id): id is string => Boolean(id));
        const details = await videoDetails(ids);
        for (const v of details) {
          if (v.id) videoMap.set(v.id, v);
        }
      } catch (e) {
        const err = e as Error & { quota?: boolean };
        if (err.quota) {
          console.warn("[youtube] quota exceeded, skipping remaining queries");
          result.errors.push("YouTube quota exceeded");
          break;
        }
        result.errors.push(
          `query "${query}": ${err instanceof Error ? err.message : String(e)}`
        );
      }
    }

    const videos = [...videoMap.values()];
    result.collected = videos.length;

    for (const v of videos) {
      result.processed++;
      const title = v.snippet?.title ?? "";
      const description = v.snippet?.description ?? "";
      const tags = (v.snippet?.tags ?? []).join(", ");
      const content = [description, tags].filter(Boolean).join("\n\n");
      const url = `https://www.youtube.com/watch?v=${v.id}`;
      const author = v.snippet?.channelTitle ?? "";
      const upvotes = parseInt(v.statistics?.likeCount ?? "0", 10) || 0;
      const comment_count =
        parseInt(v.statistics?.commentCount ?? "0", 10) || 0;

      try {
        const analysis = await analyzeStudyKoreaContent(title, content, {
          source: "youtube",
          url,
          author,
        });

        if (!analysis.is_relevant) {
          result.skipped++;
          continue;
        }

        const university =
          normalizeUniversitySlug(analysis.university, `${title} ${content}`) ||
          analysis.university;

        const status = await upsertStudyKoreaPost({
          source: "youtube",
          source_id: v.id,
          title,
          content: content.slice(0, 8000),
          url,
          author,
          upvotes,
          comment_count,
          source_created_at: v.snippet?.publishedAt ?? null,
          category: analysis.category,
          university,
          ai_summary: analysis.ai_summary,
          ai_summary_kr: analysis.ai_summary_kr,
          ai_tags: analysis.ai_tags,
          is_published: true,
        });
        if (status === "saved") result.saved++;
        else result.failed++;
      } catch (e) {
        result.failed++;
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`youtube/${v.id}: ${msg}`);
        await upsertStudyKoreaPost({
          source: "youtube",
          source_id: v.id,
          title,
          content: content.slice(0, 8000),
          url,
          author,
          upvotes,
          comment_count,
          source_created_at: v.snippet?.publishedAt ?? null,
          is_published: false,
        });
      }
    }

    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status: result.errors.some((e) => e.includes("quota"))
        ? "partial"
        : result.failed > 0
          ? "partial"
          : "success",
      error_message: result.errors.slice(0, 5).join("; "),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(msg);
    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed + 1,
      status: "failed",
      error_message: msg,
    });
  }

  return result;
}
