import { analyzeStudyKoreaContent } from "./claude";
import {
  collectRedditRssForSubreddit,
  DEFAULT_RSS_FEED,
  getRemainingSubreddits,
  getSubredditNames,
  type RedditRssItem,
} from "./reddit-rss";
import { fillEmptySummaries, shouldSavePost } from "./relevance";
import { finishPipelineRun, startPipelineRun } from "./runs";
import { upsertStudyKoreaPost } from "./save";
import type { ScrapeRunResult } from "./types";
import { normalizeUniversitySlug } from "./university-map";

const CONTENT_FOR_AI_MAX = 500;
const DEFAULT_BATCH_LIMIT = 10;

export type RedditBatchParams = {
  subreddit: string;
  feed?: string;
  limit?: number;
};

export type RedditBatchResult = {
  subreddit: string;
  feed: string;
  fetched: number;
  processed: number;
  saved: number;
  failed: number;
  skipped: number;
  remaining_subreddits: string[];
  errors: string[];
};

async function processRedditItems(
  items: RedditRssItem[],
  limit: number
): Promise<Pick<RedditBatchResult, "processed" | "saved" | "failed" | "skipped" | "errors">> {
  const result = {
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  const toProcess = items.slice(0, limit);

  for (const item of toProcess) {
    result.processed++;
    const title = item.title.trim();
    const fullContent = item.content.trim();
    const contentForAi = (fullContent || title).slice(0, CONTENT_FOR_AI_MAX);
    const url = item.link;
    const subreddit = item.subreddit;
    const universityFromTitle = normalizeUniversitySlug("", title);

    try {
      let analysis = await analyzeStudyKoreaContent(title, contentForAi, {
        source: "reddit",
        url,
        author: item.author,
        subreddit,
        language: "en",
      });

      analysis = fillEmptySummaries(title, fullContent, analysis);

      if (!shouldSavePost(subreddit, title, fullContent, analysis)) {
        result.skipped++;
        continue;
      }

      const university =
        normalizeUniversitySlug(
          analysis.university || universityFromTitle,
          `${title} ${fullContent.slice(0, 500)}`
        ) ||
        analysis.university ||
        universityFromTitle;

      const status = await upsertStudyKoreaPost({
        source: "reddit",
        source_id: item.id,
        title,
        content: fullContent.slice(0, 8000),
        url,
        author: item.author,
        language: "en",
        upvotes: 0,
        comment_count: 0,
        source_created_at: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : null,
        category: analysis.category,
        university,
        ai_summary: analysis.ai_summary,
        ai_summary_kr: analysis.ai_summary_kr,
        ai_title_en: analysis.ai_title_en || title,
        ai_summary_en: analysis.ai_summary_en || analysis.ai_summary,
        ai_content_en: analysis.ai_content_en || fullContent.slice(0, 8000),
        ai_tags: analysis.ai_tags,
        is_published: analysis.is_relevant,
      });

      if (status === "saved") result.saved++;
      else {
        result.failed++;
        result.errors.push(`upsert failed ${item.id}`);
      }
    } catch (e) {
      result.failed++;
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`reddit/${item.id}: ${msg}`);
      console.error(`[Reddit RSS] process error ${item.id}:`, msg);
    }
  }

  return result;
}

/** 단일 서브레딧 배치 (API 1회 호출분, ~60초 이내) */
export async function scrapeRedditSubredditBatch(
  params: RedditBatchParams
): Promise<RedditBatchResult> {
  const subreddit = params.subreddit.trim();
  const feed = (params.feed ?? DEFAULT_RSS_FEED).toLowerCase();
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_BATCH_LIMIT, 1), 20);

  const {
    items,
    skippedExisting,
    skippedDuplicate,
    skippedFilter,
  } = await collectRedditRssForSubreddit(subreddit, feed);

  const skippedCollect =
    skippedExisting + skippedDuplicate + skippedFilter;
  const processResult = await processRedditItems(items, limit);

  return {
    subreddit,
    feed,
    fetched: items.length,
    processed: processResult.processed,
    saved: processResult.saved,
    failed: processResult.failed,
    skipped: skippedCollect + processResult.skipped,
    remaining_subreddits: getRemainingSubreddits(subreddit),
    errors: processResult.errors,
  };
}

/** Cron master: 모든 서브레딧 순차 배치 */
export async function scrapeRedditAllSubreddits(options?: {
  feed?: string;
  limitPerSubreddit?: number;
}): Promise<{
  batches: RedditBatchResult[];
  totalSaved: number;
  totalFailed: number;
  errors: string[];
}> {
  const feed = options?.feed ?? DEFAULT_RSS_FEED;
  const limit = options?.limitPerSubreddit ?? DEFAULT_BATCH_LIMIT;
  const batches: RedditBatchResult[] = [];
  let totalSaved = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  for (const name of getSubredditNames()) {
    try {
      console.log(`[Reddit] batch start r/${name}`);
      const batch = await scrapeRedditSubredditBatch({
        subreddit: name,
        feed,
        limit,
      });
      batches.push(batch);
      totalSaved += batch.saved;
      totalFailed += batch.failed;
      if (batch.errors.length) errors.push(...batch.errors.slice(0, 2));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[Reddit] batch failed r/${name}:`, msg);
      errors.push(`${name}: ${msg}`);
      batches.push({
        subreddit: name,
        feed,
        fetched: 0,
        processed: 0,
        saved: 0,
        failed: 1,
        skipped: 0,
        remaining_subreddits: getRemainingSubreddits(name),
        errors: [msg],
      });
      totalFailed++;
    }
  }

  return { batches, totalSaved, totalFailed, errors };
}

/** @deprecated 전체 한 번에 — 타임아웃 위험. scrapeRedditAllSubreddits 사용 */
export async function scrapeRedditStudyKorea(): Promise<ScrapeRunResult> {
  const runId = await startPipelineRun("reddit", "RSS batch (all subreddits)");
  const result: ScrapeRunResult = {
    collected: 0,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { batches, totalSaved, totalFailed, errors } =
      await scrapeRedditAllSubreddits();

    for (const b of batches) {
      result.collected += b.fetched;
      result.processed += b.processed;
      result.saved += b.saved;
      result.failed += b.failed;
      result.skipped += b.skipped;
    }
    result.errors = errors;

    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status:
        result.errors.length > 0 && result.saved === 0
          ? "failed"
          : result.failed > 0
            ? "partial"
            : "success",
      error_message: result.errors.slice(0, 5).join("; "),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(msg);
    await finishPipelineRun(runId, {
      ...result,
      failed: result.failed + 1,
      status: "failed",
      error_message: msg,
    });
  }

  return result;
}
