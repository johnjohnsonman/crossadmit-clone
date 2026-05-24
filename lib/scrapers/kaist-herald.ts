/**
 * KAIST Herald Interview series scraper.
 * Interview category: https://herald.kaist.ac.kr/news/articleList.html?sc_sub_section_code=S2N21&view_type=sm
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

export const KAIST_HERALD_ORIGIN = "https://herald.kaist.ac.kr";
/** Herald nav "Interview" subsection */
export const KAIST_HERALD_INTERVIEW_LIST_URL = `${KAIST_HERALD_ORIGIN}/news/articleList.html?sc_sub_section_code=S2N21&view_type=sm`;

const ARTICLE_IDX_RE = /idxno=(\d+)/i;
const INTERVIEW_TITLE_RE = /Interview/i;

const FETCH_DELAY_MS = 500;
const DEFAULT_MAX_PAGES = 10;
const YEAR_START = 2014;

/** List queries: Interview subsection + International section (sample idxno=1570) */
const LIST_CATEGORY_PARAMS: Record<string, string>[] = [
  { sc_sub_section_code: "S2N21" },
  { sc_section_code: "S1N8" },
];

export type KaistHeraldListItem = {
  url: string;
  title: string;
  articleId: string;
};

export type ParsedKaistHeraldArticle = {
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
  if (href.startsWith("http")) return href.split("#")[0]!;
  const path = href.startsWith("/") ? href.split("#")[0]! : `/${href.split("#")[0]!}`;
  return `${KAIST_HERALD_ORIGIN}${path}`;
}

export function extractArticleId(url: string): string {
  const m = url.match(ARTICLE_IDX_RE);
  return m?.[1] ?? slugId(url);
}

function buildListUrl(
  params: Record<string, string>,
  page: number
): string {
  const q = new URLSearchParams({
    view_type: "sm",
    page: String(page),
    ...params,
  });
  return `${KAIST_HERALD_ORIGIN}/news/articleList.html?${q}`;
}

function extractIdsFromListHtml(html: string): KaistHeraldListItem[] {
  const $ = loadHtml(html);
  const seen = new Set<string>();
  const items: KaistHeraldListItem[] = [];

  $("a[href*='articleView']").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;
    const m = href.match(ARTICLE_IDX_RE);
    if (!m) return;

    const articleId = m[1]!;
    if (seen.has(articleId)) return;
    seen.add(articleId);

    const title = $(el).text().replace(/\s+/g, " ").trim();
    const url = toAbsoluteUrl(href);
    items.push({
      url,
      title: title || `KAIST Herald #${articleId}`,
      articleId,
    });
  });

  return items;
}

async function fetchListPage(
  params: Record<string, string>,
  page: number
): Promise<KaistHeraldListItem[]> {
  const listUrl = buildListUrl(params, page);
  const html = await fetchHtml(listUrl, 15_000);
  return extractIdsFromListHtml(html);
}

function currentYear(): number {
  return new Date().getUTCFullYear();
}

/** Interview/International 목록에서 article URL 수집 (페이지네이션 + 연도별 창) */
export async function collectKaistHeraldInterviewUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<KaistHeraldListItem[]> {
  const byId = new Map<string, KaistHeraldListItem>();

  const addItems = (items: KaistHeraldListItem[], label: string) => {
    let added = 0;
    for (const item of items) {
      if (!byId.has(item.articleId)) {
        byId.set(item.articleId, item);
        added++;
      }
    }
    if (added > 0) {
      console.log(`[kaist-herald] ${label}: +${added} (total ${byId.size})`);
    }
    return added;
  };

  // Recent Interview board pages
  for (let page = 1; page <= maxPages; page++) {
    const items = await fetchListPage({ sc_sub_section_code: "S2N21" }, page);
    const added = addItems(items, `interview list p${page}`);
    if (added === 0) break;
    await sleep(250);
  }

  // Year windows — site pagination drops filters; dates still rotate the top-N set
  for (let year = YEAR_START; year <= currentYear(); year++) {
    const sdate = `${year}0101`;
    const edate = `${year}1231`;
    for (const category of LIST_CATEGORY_PARAMS) {
      const items = await fetchListPage(
        { ...category, sc_sdate: sdate, sc_edate: edate },
        1
      );
      addItems(items, `${year} ${category.sc_sub_section_code ?? category.sc_section_code}`);
      await sleep(200);
    }
  }

  return [...byId.values()];
}

export function isKaistHeraldInterviewPage(html: string): boolean {
  const $ = loadHtml(html);
  return INTERVIEW_TITLE_RE.test($("title").text());
}

function extractArticleDate(html: string): string | null {
  const matches = [
    ...html.matchAll(/20(1\d|2[0-5])[.\-/](\d{2})[.\-/](\d{2})/g),
  ];
  for (const m of matches) {
    const y = `20${m[1]}`;
    const mo = m[2]!;
    const d = m[3]!;
    const iso = `${y}-${mo}-${d}T00:00:00Z`;
    if (y >= "2010" && y <= "2030") return iso;
  }
  return null;
}

export function parseKaistHeraldArticlePage(
  html: string,
  url: string
): ParsedKaistHeraldArticle | null {
  if (!isKaistHeraldInterviewPage(html)) return null;

  const $ = loadHtml(html);
  const title =
    $(".heading").first().text().replace(/\s+/g, " ").trim() ||
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title")
      .text()
      .split("<")[0]
      ?.trim() ||
    "";

  const body =
    $("#article-view-content-div").text().replace(/\s+/g, " ").trim() ||
    $(".article-body").text().replace(/\s+/g, " ").trim() ||
    $(".article-view-content").text().replace(/\s+/g, " ").trim() ||
    "";

  if (!title || body.length < 120) return null;

  const author =
    $(".user-name").first().text().replace(/\s+/g, " ").trim() ||
    $(".byline .name").first().text().replace(/\s+/g, " ").trim() ||
    "KAIST Herald Student";

  return {
    title,
    body: body.slice(0, 12_000),
    author,
    source_created_at: extractArticleDate(html),
    articleId: extractArticleId(url),
  };
}

export type ScrapeKaistHeraldOptions = {
  maxPages?: number;
  maxArticles?: number;
};

export async function scrapeKaistHeraldInterviews(
  options: ScrapeKaistHeraldOptions = {}
): Promise<ScrapeRunResult & { articles_found: number }> {
  resetClassifierRunCounter();
  const runId = await startPipelineRun(
    "kaist_herald",
    `KAIST Herald interviews · ${KAIST_HERALD_INTERVIEW_LIST_URL}`
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
    const list = await collectKaistHeraldInterviewUrls(
      options.maxPages ?? DEFAULT_MAX_PAGES
    );
    const toProcess = options.maxArticles
      ? list.slice(0, options.maxArticles)
      : list;
    result.collected = toProcess.length;
    result.articles_found = list.length;

    console.log(
      `[kaist-herald] processing ${toProcess.length} / ${list.length} candidate articles`
    );

    for (const item of toProcess) {
      result.processed++;
      try {
        const html = await fetchHtml(item.url, 15_000);
        const parsed = parseKaistHeraldArticlePage(html, item.url);
        if (!parsed) {
          result.skipped++;
          result.errors.push(`not_interview_or_empty:${item.articleId}`);
          continue;
        }

        const routeResult = await routeScrapedPost(
          scrapedPostFromRaw({
            source: "kaist_herald",
            source_id: `kaist-herald-${parsed.articleId}`,
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
        console.error(`[kaist-herald] failed ${item.url}:`, msg);
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
    `[kaist-herald] done admissions=${result.routed_admissions} review=${result.routed_review} general=${result.routed_general}`
  );

  return result;
}
