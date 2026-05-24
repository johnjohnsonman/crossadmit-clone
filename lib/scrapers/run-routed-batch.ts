import { resetClassifierRunCounter } from "@/lib/classifiers/classifier-usage";
import {
  routeScrapedPost,
  scrapedPostFromRaw,
} from "@/lib/scrapers/router";
import { setActivePipelineRunId } from "@/lib/scrapers/run-context";
import {
  finishPipelineRun,
  startPipelineRun,
} from "@/lib/pipeline/study-korea/runs";
import type {
  ScrapeRunResult,
  StudyKoreaSource,
} from "@/lib/pipeline/study-korea/types";

export type RoutedRawItem = {
  source_id: string;
  title: string;
  content: string;
  url: string;
  author?: string;
  subreddit?: string;
  language?: string;
  upvotes?: number;
  comment_count?: number;
  source_created_at?: string | null;
  skipClaude?: boolean;
  university_id?: number | null;
};

const ITEM_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function applyRouteResult(
  result: Awaited<ReturnType<typeof routeScrapedPost>>,
  counts: ScrapeRunResult
) {
  if (result.routed === "admission") {
    counts.routed_admissions += 1;
    counts.saved += 1;
    return;
  }
  if (result.routed === "review_needed") {
    counts.routed_review += 1;
    counts.saved += 1;
    return;
  }
  if (result.routed === "general") {
    counts.routed_general += 1;
    counts.saved += 1;
    return;
  }
  counts.skipped += 1;
}

/**
 * Fetch된 raw 항목을 routeScrapedPost로 일괄 라우팅 + pipeline_runs_study_korea 기록.
 */
export async function runRoutedBatch(
  runSource: string,
  source: StudyKoreaSource,
  items: RoutedRawItem[],
  query = ""
): Promise<ScrapeRunResult> {
  resetClassifierRunCounter();
  const runId = await startPipelineRun(runSource, query);
  setActivePipelineRunId(runId);

  const result: ScrapeRunResult = {
    collected: items.length,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    routed_admissions: 0,
    routed_review: 0,
    routed_general: 0,
    errors: [],
  };

  console.log(`[scraper:${runSource}] collected:`, items.length);

  try {
    for (const item of items) {
      result.processed++;
      const title = item.title.trim();
      const content = (item.content ?? "").trim();
      if (!title && !content) {
        result.skipped++;
        continue;
      }

      try {
        const routeResult = await routeScrapedPost(
          scrapedPostFromRaw({
            source_id: item.source_id,
            title,
            content,
            url: item.url,
            author: item.author,
            subreddit: item.subreddit,
            language: item.language,
            source_created_at: item.source_created_at,
            upvotes: item.upvotes,
            comment_count: item.comment_count,
            university_id: item.university_id,
            skipClaude: item.skipClaude,
            source,
          })
        );
        applyRouteResult(routeResult, result);
      } catch (e) {
        result.failed++;
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`${item.source_id}: ${msg}`);
        console.error(`[scraper:${runSource}] item failed ${item.source_id}:`, msg);
      }

      await sleep(ITEM_DELAY_MS);
    }

    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status:
        result.saved === 0 && result.collected > 0
          ? "partial"
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
  } finally {
    setActivePipelineRunId(null);
  }

  console.log(
    `[scraper:${runSource}] done admissions=${result.routed_admissions} review=${result.routed_review} general=${result.routed_general}`
  );
  return result;
}
