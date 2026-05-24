import { resetClassifierRunCounter } from "@/lib/classifiers/classifier-usage";
import {
  collectRedditRssForSubreddit,
  DEFAULT_RSS_FEED,
  getRemainingSubreddits,
  getSubredditNames,
  type RedditRssItem,
} from "./reddit-rss";
import { finishPipelineRun, startPipelineRun } from "./runs";
import {
  routeScrapedPost,
  scrapedPostFromRaw,
} from "@/lib/scrapers/router";
import type { ScrapeRunResult } from "./types";

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
  routed_admissions: number;
  routed_review: number;
  routed_general: number;
  remaining_subreddits: string[];
  errors: string[];
};

async function processRedditItems(
  items: RedditRssItem[],
  limit: number
): Promise<
  Pick<
    RedditBatchResult,
    | "processed"
    | "saved"
    | "failed"
    | "skipped"
    | "routed_admissions"
    | "routed_review"
    | "routed_general"
    | "errors"
  >
> {
  const result = {
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    routed_admissions: 0,
    routed_review: 0,
    routed_general: 0,
    errors: [] as string[],
  };

  const toProcess = items.slice(0, limit);

  for (const item of toProcess) {
    result.processed++;
    const title = item.title.trim();
    const fullContent = item.content.trim();
    const url = item.link;

    try {
      const routeResult = await routeScrapedPost(
        scrapedPostFromRaw({
          source_id: item.id,
          title,
          content: fullContent,
          url,
          author: item.author,
          subreddit: item.subreddit,
          language: "en",
          source_created_at: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : null,
          source: "reddit",
        })
      );

      if (routeResult.routed === "admission") {
        result.routed_admissions += 1;
        result.saved += 1;
      } else if (routeResult.routed === "review_needed") {
        result.routed_review += 1;
        result.saved += 1;
      } else if (routeResult.routed === "general") {
        result.routed_general += 1;
        result.saved += 1;
      } else {
        result.skipped += 1;
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
  resetClassifierRunCounter();
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
    routed_admissions: processResult.routed_admissions,
    routed_review: processResult.routed_review,
    routed_general: processResult.routed_general,
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
  totalRoutedAdmissions: number;
  totalRoutedReview: number;
  totalRoutedGeneral: number;
  errors: string[];
}> {
  const feed = options?.feed ?? DEFAULT_RSS_FEED;
  const limit = options?.limitPerSubreddit ?? DEFAULT_BATCH_LIMIT;
  const batches: RedditBatchResult[] = [];
  let totalSaved = 0;
  let totalFailed = 0;
  let totalRoutedAdmissions = 0;
  let totalRoutedReview = 0;
  let totalRoutedGeneral = 0;
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
      totalRoutedAdmissions += batch.routed_admissions;
      totalRoutedReview += batch.routed_review;
      totalRoutedGeneral += batch.routed_general;
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
        routed_admissions: 0,
        routed_review: 0,
        routed_general: 0,
        remaining_subreddits: getRemainingSubreddits(name),
        errors: [msg],
      });
      totalFailed++;
    }
  }

  return {
    batches,
    totalSaved,
    totalFailed,
    totalRoutedAdmissions,
    totalRoutedReview,
    totalRoutedGeneral,
    errors,
  };
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
    routed_admissions: 0,
    routed_review: 0,
    routed_general: 0,
    errors: [],
  };

  try {
    const {
      batches,
      totalSaved,
      totalFailed,
      totalRoutedAdmissions,
      totalRoutedReview,
      totalRoutedGeneral,
      errors,
    } = await scrapeRedditAllSubreddits();

    for (const b of batches) {
      result.collected += b.fetched;
      result.processed += b.processed;
      result.saved += b.saved;
      result.failed += b.failed;
      result.skipped += b.skipped;
    }
    result.routed_admissions = totalRoutedAdmissions;
    result.routed_review = totalRoutedReview;
    result.routed_general = totalRoutedGeneral;
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
      routed_admissions: result.routed_admissions,
      routed_review: result.routed_review,
      routed_general: result.routed_general,
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
      routed_admissions: result.routed_admissions,
      routed_review: result.routed_review,
      routed_general: result.routed_general,
    });
  }

  return result;
}
