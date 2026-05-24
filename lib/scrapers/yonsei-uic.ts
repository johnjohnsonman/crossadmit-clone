/**
 * Yonsei UIC official [Student Interview] series scraper.
 * Board: https://www.yonsei.ac.kr/bbs/en_sc/259/artclList.do
 */
import { resetClassifierRunCounter } from "@/lib/classifiers/classifier-usage";
import {
  fetchHtml,
  loadHtml,
  slugId,
} from "@/lib/pipeline/study-korea/fetch-html";
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

export const YONSEI_UIC_LIST_URL =
  "https://www.yonsei.ac.kr/bbs/en_sc/259/artclList.do";
export const YONSEI_UIC_ORIGIN = "https://www.yonsei.ac.kr";
const STUDENT_INTERVIEW_TITLE = /\[Student Interview\]/i;
const ARTICLE_PATH_RE = /\/bbs\/en_sc\/259\/(\d+)\/artclView\.do/i;

const FETCH_DELAY_MS = 500;
const DEFAULT_MAX_PAGES = 20;

export type YonseiUicListItem = {
  url: string;
  title: string;
  articleId: string;
};

export type ParsedYonseiArticle = {
  title: string;
  body: string;
  author: string;
  source_created_at: string | null;
  articleId: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toAbsoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${YONSEI_UIC_ORIGIN}${path}`;
}

export function extractArticleId(url: string): string {
  const m = url.match(ARTICLE_PATH_RE);
  return m?.[1] ?? slugId(url);
}

/** 목록 페이지에서 [Student Interview] 글 URL만 수집 (페이지네이션: ?page=N) */
export async function collectStudentInterviewUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<YonseiUicListItem[]> {
  const seen = new Set<string>();
  const items: YonseiUicListItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const listUrl =
      page === 1 ? YONSEI_UIC_LIST_URL : `${YONSEI_UIC_LIST_URL}?page=${page}`;
    const html = await fetchHtml(listUrl, 15_000);
    const $ = loadHtml(html);
    let added = 0;

    $("a[href*='artclView']").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;
      const title = $(el).text().replace(/\s+/g, " ").trim();
      if (!STUDENT_INTERVIEW_TITLE.test(title)) return;

      const url = toAbsoluteUrl(href);
      const articleId = extractArticleId(url);
      if (seen.has(url)) return;
      seen.add(url);
      items.push({ url, title, articleId });
      added++;
    });

    console.log(`[yonsei-uic] list page ${page}: +${added} (total ${items.length})`);
    if (added === 0) break;
    await sleep(300);
  }

  return items;
}

export function parseYonseiArticlePage(
  html: string,
  url: string
): ParsedYonseiArticle | null {
  const $ = loadHtml(html);
  const title =
    $(".title").first().text().replace(/\s+/g, " ").trim() ||
    $("meta[property='og:title']").attr("content")?.trim() ||
    "";

  const body =
    $(".fr-view").text().replace(/\s+/g, " ").trim() ||
    $(".viewCont .txt").text().replace(/\s+/g, " ").trim() ||
    $(".board-view .txt").text().replace(/\s+/g, " ").trim() ||
    "";

  if (!title || body.length < 120) return null;

  const dateMatch = $(".board-view, .board_view, body")
    .text()
    .match(/Date\s*(\d{4})\.(\d{2})\.(\d{2})/i);
  const source_created_at = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`
    : null;

  const nameMatch = body.match(/Name:\s*([^\n]+?)(?:Nationality|College|Major|$)/i);
  const author = nameMatch?.[1]?.trim() || "Yonsei UIC Student";

  return {
    title,
    body: body.slice(0, 12_000),
    author,
    source_created_at,
    articleId: extractArticleId(url),
  };
}

export type ScrapeYonseiUicOptions = {
  maxPages?: number;
  maxArticles?: number;
};

export async function scrapeYonseiUicInterviews(
  options: ScrapeYonseiUicOptions = {}
): Promise<ScrapeRunResult & { articles_found: number }> {
  resetClassifierRunCounter();
  const runId = await startPipelineRun(
    "yonsei_uic",
    `UIC student interviews · ${YONSEI_UIC_LIST_URL}`
  );
  setActivePipelineRunId(runId);

  const result: ScrapeRunResult & { articles_found: number } = {
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
  };

  try {
    const list = await collectStudentInterviewUrls(options.maxPages ?? DEFAULT_MAX_PAGES);
    const toProcess = options.maxArticles
      ? list.slice(0, options.maxArticles)
      : list;
    result.collected = toProcess.length;
    result.articles_found = list.length;

    console.log(
      `[yonsei-uic] processing ${toProcess.length} / ${list.length} student interviews`
    );

    for (const item of toProcess) {
      result.processed++;
      try {
        const html = await fetchHtml(item.url, 15_000);
        const parsed = parseYonseiArticlePage(html, item.url);
        if (!parsed) {
          result.skipped++;
          result.errors.push(`parse_empty:${item.articleId}`);
          continue;
        }

        const routeResult = await routeScrapedPost(
          scrapedPostFromRaw({
            source: "yonsei_uic",
            source_id: `yonsei-uic-${parsed.articleId}`,
            title: parsed.title,
            content: parsed.body,
            url: item.url,
            author: parsed.author,
            language: "en",
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
      } catch (e) {
        result.failed++;
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`${item.articleId}: ${msg}`);
        console.error(`[yonsei-uic] failed ${item.url}:`, msg);
      }

      await sleep(FETCH_DELAY_MS);
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
    `[yonsei-uic] done admissions=${result.routed_admissions} review=${result.routed_review} general=${result.routed_general}`
  );

  return result;
}
