/**
 * Korea University KU Insights scraper.
 * Board: https://www.korea.ac.kr/bbs/en/66/artclList.do
 * Public article URL: https://www.korea.ac.kr/en/1129/subview.do?enc=...
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

export const KU_INSIGHTS_LIST_URL =
  "https://www.korea.ac.kr/bbs/en/66/artclList.do";
export const KU_INSIGHTS_ORIGIN = "https://www.korea.ac.kr";
export const KU_INSIGHTS_MENU_ID = "1129";
export const KU_INSIGHTS_BOARD_ID = "66";

const ARTICLE_PATH_RE = /\/bbs\/en\/66\/(\d+)\/artclView\.do/i;
const FETCH_DELAY_MS = 500;
const DEFAULT_MAX_PAGES = 10;
const KNOWN_SERIES_IDS = new Set(["26853", "26864"]);

export type KuInsightsListItem = {
  url: string;
  fetchUrl: string;
  title: string;
  articleId: string;
  enc: string;
  score: number;
};

export type ParsedKuInsightsArticle = {
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
  return `${KU_INSIGHTS_ORIGIN}${path}`;
}

export function extractArticleId(url: string): string {
  const m = url.match(ARTICLE_PATH_RE);
  return m?.[1] ?? slugId(url);
}

function encodeKuArticlePath(articleId: string): string {
  const encodedPath = encodeURIComponent(`/bbs/en/66/${articleId}/artclView.do?`);
  return Buffer.from(`fnct1|@@|${encodedPath}`).toString("base64");
}

export function toPublicArticleUrl(articleId: string): string {
  const enc = encodeKuArticlePath(articleId);
  return `${KU_INSIGHTS_ORIGIN}/en/${KU_INSIGHTS_MENU_ID}/subview.do?enc=${enc}`;
}

function cleanListTitle(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/^No\.\s*\d+\s*/i, "")
    .replace(/\s*registration date.*$/i, "")
    .trim();
}

function scoreKuInsightsTitle(articleId: string, title: string): number {
  const t = title.toLowerCase();
  let score = 0;

  if (KNOWN_SERIES_IDS.has(articleId)) score += 100;
  if (/voice of international students/.test(t)) score += 30;
  if (/exchange student/.test(t)) score += 28;
  if (/international students?/.test(t)) score += 26;
  if (/\bkuba\b|\bkuisa\b|buddy/.test(t)) score += 24;
  if (/pacific ocean|study abroad|from across/.test(t)) score += 20;
  if (/foreign|overseas/.test(t)) score += 18;
  if (/small communities within korea univer/.test(t)) score += 18;
  if (/melting pot|global perspective|global village|eyes of international/.test(t)) {
    score += 16;
  }
  if (/real life, exchange student daily log/.test(t)) score += 16;

  return score;
}

/**
 * 목록 페이지에서 전체 article URL을 수집하고, 국제학생 인터뷰 가능성이 높은 글을
 * 제목 점수로 우선순위화한다. 실제 처리 대상은 maxArticles 옵션에서 자른다.
 */
export async function collectKuInsightsUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<KuInsightsListItem[]> {
  const seen = new Set<string>();
  const items: KuInsightsListItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const listUrl = page === 1 ? KU_INSIGHTS_LIST_URL : `${KU_INSIGHTS_LIST_URL}?page=${page}`;
    const html = await fetchHtml(listUrl, 20_000);
    const $ = loadHtml(html);
    let added = 0;

    $("a[href*='/bbs/en/66/'][href*='artclView.do']").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;

      const fetchUrl = toAbsoluteUrl(href);
      const articleId = extractArticleId(fetchUrl);
      if (seen.has(articleId)) return;

      const title =
        cleanListTitle($(el).find("strong.title").first().text()) ||
        cleanListTitle($(el).text());
      if (!title) return;

      const enc = encodeKuArticlePath(articleId);
      const url = `${KU_INSIGHTS_ORIGIN}/en/${KU_INSIGHTS_MENU_ID}/subview.do?enc=${enc}`;
      items.push({
        url,
        fetchUrl,
        title,
        articleId,
        enc,
        score: scoreKuInsightsTitle(articleId, title),
      });
      seen.add(articleId);
      added++;
    });

    console.log(`[ku-insights] list page ${page}: +${added} (total ${items.length})`);
    if (added === 0) break;
    await sleep(300);
  }

  return items;
}

function trimKuInsightsBody(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const markers = [
    "- In charge",
    "In charge Communications Team",
    "Update : 2020-10-28",
    "TOP",
  ];

  let out = cleaned;
  for (const marker of markers) {
    const idx = out.indexOf(marker);
    if (idx > 0) {
      out = out.slice(0, idx).trim();
    }
  }
  return out;
}

export function parseKuInsightsArticlePage(
  html: string,
  url: string
): ParsedKuInsightsArticle | null {
  const $ = loadHtml(html);
  const title =
    $(".board-view .title strong").first().text().replace(/\s+/g, " ").trim() ||
    $("#artclViewTitle").attr("value")?.trim() ||
    $("meta[property='og:title']").attr("content")?.trim() ||
    "";

  const body =
    trimKuInsightsBody($(".board-view .txt").first().text()) ||
    trimKuInsightsBody($(".board-view .view .txt").first().text()) ||
    "";

  if (!title || body.length < 120) return null;

  const dateMatch = $(".board-view, body")
    .text()
    .match(/writing date\s*(\d{4})\.(\d{2})\.(\d{2})/i);
  const source_created_at = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`
    : null;

  const authorMatch = $(".board-view, body")
    .text()
    .match(/author\s*([^\n]+?)\s*hits/i);
  const author = authorMatch?.[1]?.replace(/\s+/g, " ").trim() || "KU TODAY";

  return {
    title,
    body: body.slice(0, 12_000),
    author,
    source_created_at,
    articleId: extractArticleId(url),
  };
}

export type ScrapeKuInsightsOptions = {
  maxPages?: number;
  maxArticles?: number;
};

export async function scrapeKuInsights(
  options: ScrapeKuInsightsOptions = {}
): Promise<
  ScrapeRunResult & {
    articles_found: number;
    candidate_found: number;
    board_list_url: string;
  }
> {
  resetClassifierRunCounter();
  const runId = await startPipelineRun(
    "ku_insights",
    `KU Insights · ${KU_INSIGHTS_LIST_URL}`
  );
  setActivePipelineRunId(runId);

  const result: ScrapeRunResult & {
    articles_found: number;
    candidate_found: number;
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
    candidate_found: 0,
    board_list_url: KU_INSIGHTS_LIST_URL,
  };

  try {
    const list = await collectKuInsightsUrls(options.maxPages ?? DEFAULT_MAX_PAGES);
    const candidates = [...list]
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.articleId) - Number(a.articleId));

    const toProcess = options.maxArticles
      ? candidates.slice(0, options.maxArticles)
      : candidates;

    result.articles_found = list.length;
    result.candidate_found = candidates.length;
    result.collected = toProcess.length;

    console.log(
      `[ku-insights] processing ${toProcess.length} / ${candidates.length} candidates (board total ${list.length})`
    );

    for (const item of toProcess) {
      result.processed++;
      try {
        const html = await fetchHtml(item.fetchUrl, 15_000);
        const parsed = parseKuInsightsArticlePage(html, item.fetchUrl);
        if (!parsed) {
          result.skipped++;
          result.errors.push(`parse_empty:${item.articleId}`);
          continue;
        }

        const routeResult = await routeScrapedPost(
          scrapedPostFromRaw({
            source: "ku_insights",
            source_id: `ku-insights-${parsed.articleId}`,
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
        console.error(`[ku-insights] failed ${item.fetchUrl}:`, msg);
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
    `[ku-insights] done admissions=${result.routed_admissions} review=${result.routed_review} general=${result.routed_general}`
  );

  return result;
}
