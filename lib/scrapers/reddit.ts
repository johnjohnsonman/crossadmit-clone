/**
 * Reddit RSS scraper — each item routed via routeScrapedPost().
 */
import { resetClassifierRunCounter } from "@/lib/classifiers/classifier-usage";
import {
  collectRedditRssForSubreddit,
  DEFAULT_RSS_FEED,
  getRemainingSubreddits,
  getSubredditNames,
  type RedditRssItem,
} from "@/lib/pipeline/study-korea/reddit-rss";
import {
  finishPipelineRun,
  startPipelineRun,
} from "@/lib/pipeline/study-korea/runs";
import {
  routeScrapedPost,
  scrapedPostFromRaw,
} from "@/lib/scrapers/router";
import { setActivePipelineRunId } from "@/lib/scrapers/run-context";
import type { ScrapeRunResult } from "@/lib/pipeline/study-korea/types";

export {
  ADMISSION_FOCUSED_SUBREDDITS,
  GENERAL_INFO_SUBREDDITS,
  getSubredditNames,
} from "@/lib/pipeline/study-korea/reddit-rss";

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
  pipeline_run_id?: string;
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

  for (const item of items.slice(0, limit)) {
    result.processed++;
    try {
      const routeResult = await routeScrapedPost(
        scrapedPostFromRaw({
          source_id: item.id,
          title: item.title.trim(),
          content: item.content.trim(),
          url: item.link,
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
      console.error(`[scraper:reddit] item error ${item.id}:`, msg);
    }
  }

  return result;
}

/** 단일 서브레딧 배치 — pipeline_runs_study_korea 기록 포함 */
export async function scrapeRedditSubredditBatch(
  params: RedditBatchParams
): Promise<RedditBatchResult> {
  resetClassifierRunCounter();
  const subreddit = params.subreddit.trim();
  const feed = (params.feed ?? DEFAULT_RSS_FEED).toLowerCase();
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_BATCH_LIMIT, 1), 20);

  const runId = await startPipelineRun(
    "reddit",
    `r/${subreddit} feed=${feed} limit=${limit}`
  );
  setActivePipelineRunId(runId);

  try {
    const {
      items,
      skippedExisting,
      skippedDuplicate,
      skippedFilter,
    } = await collectRedditRssForSubreddit(subreddit, feed);

    const skippedCollect =
      skippedExisting + skippedDuplicate + skippedFilter;
    const processResult = await processRedditItems(items, limit);

    await finishPipelineRun(runId, {
      collected: items.length + skippedCollect,
      processed: processResult.processed,
      saved: processResult.saved,
      failed: processResult.failed,
      status:
        processResult.failed > 0 && processResult.saved === 0
          ? "partial"
          : processResult.failed > 0
            ? "partial"
            : "success",
      error_message: processResult.errors.slice(0, 5).join("; "),
      routed_admissions: processResult.routed_admissions,
      routed_review: processResult.routed_review,
      routed_general: processResult.routed_general,
    });

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
      pipeline_run_id: runId,
      remaining_subreddits: getRemainingSubreddits(subreddit),
      errors: processResult.errors,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finishPipelineRun(runId, {
      collected: 0,
      processed: 0,
      saved: 0,
      failed: 1,
      status: "failed",
      error_message: msg,
      routed_admissions: 0,
      routed_review: 0,
      routed_general: 0,
    });
    throw e;
  } finally {
    setActivePipelineRunId(null);
  }
}

export async function scrapeRedditAllSubreddits(options?: {
  feed?: string;
  limitPerSubreddit?: number;
}) {
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
      errors.push(`${name}: ${msg}`);
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

export async function scrapeRedditStudyKorea(): Promise<ScrapeRunResult> {
  const {
    batches,
    totalSaved,
    totalFailed,
    totalRoutedAdmissions,
    totalRoutedReview,
    totalRoutedGeneral,
    errors,
  } = await scrapeRedditAllSubreddits();

  const result: ScrapeRunResult = {
    collected: 0,
    processed: 0,
    saved: totalSaved,
    failed: totalFailed,
    skipped: 0,
    routed_admissions: totalRoutedAdmissions,
    routed_review: totalRoutedReview,
    routed_general: totalRoutedGeneral,
    errors,
  };

  for (const b of batches) {
    result.collected += b.fetched;
    result.processed += b.processed;
    result.skipped += b.skipped;
  }

  return result;
}
