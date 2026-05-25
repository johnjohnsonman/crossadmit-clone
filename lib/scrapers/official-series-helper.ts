import { resetClassifierRunCounter } from "@/lib/classifiers/classifier-usage";
import { fetchHtml } from "@/lib/pipeline/study-korea/fetch-html";
import {
  finishPipelineRun,
  startPipelineRun,
} from "@/lib/pipeline/study-korea/runs";
import type { ScrapeRunResult } from "@/lib/pipeline/study-korea/types";
import {
  routeScrapedPost,
  scrapedPostFromRaw,
} from "@/lib/scrapers/router";
import { setActivePipelineRunId } from "@/lib/scrapers/run-context";

export type OfficialSeriesListItem = {
  url: string;
  fetchUrl?: string;
  title: string;
  articleId: string;
  author?: string;
};

export type ParsedOfficialSeriesArticle = {
  title: string;
  body: string;
  author: string;
  source_created_at: string | null;
  articleId: string;
  publicUrl?: string;
};

export type ScrapeOfficialSeriesOptions = {
  maxPages?: number;
  maxArticles?: number;
};

type OfficialSeriesConfig = {
  source: string;
  label: string;
  boardListUrl: string;
  language: string;
  defaultMaxPages: number;
  fetchDelayMs?: number;
  collect: (maxPages: number) => Promise<OfficialSeriesListItem[]>;
  parse: (
    html: string,
    item: OfficialSeriesListItem
  ) => ParsedOfficialSeriesArticle | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function toAbsoluteUrl(origin: string, href: string): string {
  return new URL(href, origin).toString();
}

export function parseIsoDate(text: string): string | null {
  const dotted = text.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (dotted) {
    return `${dotted[1]}-${dotted[2]}-${dotted[3]}T00:00:00Z`;
  }

  const dashed = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dashed) {
    return `${dashed[1]}-${dashed[2]}-${dashed[3]}T00:00:00Z`;
  }

  return null;
}

export function cutBeforeMarker(text: string, markers: string[]): string {
  let out = text;
  for (const marker of markers) {
    const idx = out.indexOf(marker);
    if (idx > 0) {
      out = out.slice(0, idx).trim();
    }
  }
  return out.trim();
}

export async function runOfficialSeriesScraper(
  config: OfficialSeriesConfig,
  options: ScrapeOfficialSeriesOptions = {}
): Promise<
  ScrapeRunResult & {
    articles_found: number;
    board_list_url: string;
  }
> {
  resetClassifierRunCounter();
  const runId = await startPipelineRun(
    config.source,
    `${config.label} · ${config.boardListUrl}`
  );
  setActivePipelineRunId(runId);

  const result: ScrapeRunResult & {
    articles_found: number;
    board_list_url: string;
  } = {
    collected: 0,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    routed_admissions: 0,
    routed_review: 0,
    routed_general: 0,
    errors: [],
    articles_found: 0,
    board_list_url: config.boardListUrl,
  };

  try {
    const items = await config.collect(options.maxPages ?? config.defaultMaxPages);
    const toProcess = options.maxArticles ? items.slice(0, options.maxArticles) : items;

    result.articles_found = items.length;
    result.collected = toProcess.length;

    console.log(
      `[${config.source}] processing ${toProcess.length} / ${items.length} articles`
    );

    for (const item of toProcess) {
      result.processed++;
      try {
        const detailUrl = item.fetchUrl ?? item.url;
        const html = await fetchHtml(detailUrl, 20_000);
        const parsed = config.parse(html, item);
        if (!parsed) {
          result.skipped++;
          result.errors.push(`parse_empty:${item.articleId}`);
          continue;
        }

        const routeResult = await routeScrapedPost(
          scrapedPostFromRaw({
            source: config.source,
            source_id: `${config.source}-${parsed.articleId}`,
            title: parsed.title,
            content: parsed.body,
            url: parsed.publicUrl ?? item.url,
            author: parsed.author,
            language: config.language,
            source_created_at: parsed.source_created_at,
          })
        );

        if (routeResult.routed === "admission") {
          result.routed_admissions++;
          result.saved++;
        } else if (routeResult.routed === "review_needed") {
          result.routed_review++;
          result.saved++;
        } else if (routeResult.routed === "general") {
          result.routed_general++;
          result.saved++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.failed++;
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`${item.articleId}: ${message}`);
        console.error(`[${config.source}] failed ${item.url}:`, message);
      }

      await sleep(config.fetchDelayMs ?? 500);
    }

    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status:
        result.failed > 0 && result.saved === 0
          ? "partial"
          : result.failed > 0
            ? "partial"
            : "success",
      error_message: result.errors.slice(0, 5).join("; "),
      routed_admissions: result.routed_admissions,
      routed_review: result.routed_review,
      routed_general: result.routed_general,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(message);
    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed + 1,
      status: "failed",
      error_message: message,
      routed_admissions: result.routed_admissions,
      routed_review: result.routed_review,
      routed_general: result.routed_general,
    });
  } finally {
    setActivePipelineRunId(null);
  }

  console.log(
    `[${config.source}] done admissions=${result.routed_admissions} review=${result.routed_review} general=${result.routed_general}`
  );

  return result;
}
