/**
 * Study Korea News (studykoreanews.com) — international student / GKS stories.
 * Same school newspaper CMS as KAIST Herald.
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

export const STUDY_KOREA_NEWS_ORIGIN = "https://www.studykoreanews.com";
export const STUDY_KOREA_NEWS_LIST_URL = `${STUDY_KOREA_NEWS_ORIGIN}/news/articleList.html?sc_serial_code=SRN13&view_type=sm`;

const ARTICLE_IDX_RE = /idxno=(\d+)/i;
const FETCH_DELAY_MS = 500;
const DEFAULT_MAX_PAGES = 10;

/** Priority feeds: Admissions-adjacent, scholarship/GKS, interview, education */
export const STUDY_KOREA_NEWS_LIST_FEEDS: Record<string, string>[] = [
  { sc_area: "K", sc_word: "GKS" },
  { sc_area: "K", sc_word: "GKSInterview" },
  { sc_serial_code: "SRN13" },
  { sc_sub_section_code: "S2N8" },
  { sc_sub_section_code: "S2N9" },
  { sc_sub_section_code: "S2N11" },
  { sc_sub_section_code: "S2N5" },
  { sc_section_code: "S1N3" },
  { sc_word: "GKS", searchtp: "all" },
  { sc_word: "Global Korea Scholarship", searchtp: "all" },
  { sc_word: "admitted", searchtp: "all" },
  { sc_word: "scholarship", searchtp: "all" },
];

export type StudyKoreaNewsListItem = {
  url: string;
  title: string;
  articleId: string;
};

export type ParsedStudyKoreaNewsArticle = {
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
  return `${STUDY_KOREA_NEWS_ORIGIN}${path}`;
}

export function extractArticleId(url: string): string {
  const m = url.match(ARTICLE_IDX_RE);
  return m?.[1] ?? slugId(url);
}

function buildListUrl(params: Record<string, string>, page: number): string {
  const q = new URLSearchParams({
    view_type: "sm",
    page: String(page),
    ...params,
  });
  return `${STUDY_KOREA_NEWS_ORIGIN}/news/articleList.html?${q}`;
}

function extractIdsFromListHtml(html: string): StudyKoreaNewsListItem[] {
  const $ = loadHtml(html);
  const seen = new Set<string>();
  const items: StudyKoreaNewsListItem[] = [];

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
      title: title || `Study Korea News #${articleId}`,
      articleId,
    });
  });

  return items;
}

async function fetchListPage(
  params: Record<string, string>,
  page: number
): Promise<StudyKoreaNewsListItem[]> {
  const html = await fetchHtml(buildListUrl(params, page), 15_000);
  return extractIdsFromListHtml(html);
}

/** 타겟 카테고리·태그·검색 목록에서 article URL 수집 */
export async function collectStudyKoreaNewsUrls(
  maxPages = DEFAULT_MAX_PAGES,
  feeds: Record<string, string>[] = STUDY_KOREA_NEWS_LIST_FEEDS
): Promise<StudyKoreaNewsListItem[]> {
  const byId = new Map<string, StudyKoreaNewsListItem>();

  const addItems = (items: StudyKoreaNewsListItem[], label: string) => {
    let added = 0;
    for (const item of items) {
      if (!byId.has(item.articleId)) {
        byId.set(item.articleId, {
          ...item,
          url: `${STUDY_KOREA_NEWS_ORIGIN}/news/articleView.html?idxno=${item.articleId}`,
        });
        added++;
      }
    }
    if (added > 0) {
      console.log(`[study-korea-news] ${label}: +${added} (total ${byId.size})`);
    }
    return added;
  };

  for (const params of feeds) {
    const label =
      params.sc_word && params.sc_area
        ? `tag ${params.sc_word}`
        : params.sc_serial_code ??
          params.sc_sub_section_code ??
          params.sc_section_code ??
          params.sc_word ??
          "list";

    for (let page = 1; page <= maxPages; page++) {
      const items = await fetchListPage(params, page);
      const added = addItems(items, `${label} p${page}`);
      if (added === 0) break;
      await sleep(250);
    }
  }

  return [...byId.values()];
}

function extractArticleDate(html: string): string | null {
  const matches = [
    ...html.matchAll(/20(1\d|2[0-5])[.\-/](\d{2})[.\-/](\d{2})/g),
  ];
  for (const m of matches) {
    const y = `20${m[1]}`;
    const mo = m[2]!;
    const d = m[3]!;
    if (y >= "2010" && y <= "2030") {
      return `${y}-${mo}-${d}T00:00:00Z`;
    }
  }
  return null;
}

function detectLanguage(text: string): string {
  if (/[가-힣]{20,}/.test(text)) return "ko";
  if (/[\u0600-\u06FF]{12,}/.test(text)) return "ar";
  if (/[\u0400-\u04FF]{12,}/.test(text)) return "ru";
  if (/[\u4e00-\u9fff]{12,}/.test(text)) return "zh";
  return "en";
}

export function parseStudyKoreaNewsArticlePage(
  html: string,
  url: string
): ParsedStudyKoreaNewsArticle | null {
  const $ = loadHtml(html);
  const title =
    $(".heading").first().text().replace(/\s+/g, " ").trim() ||
    $("meta[property='og:title']").attr("content")?.trim()?.split("<")[0]?.trim() ||
    $("title").text().split("<")[0]?.trim() ||
    "";

  const body =
    $("#article-view-content-div").text().replace(/\s+/g, " ").trim() ||
    $(".article-body").text().replace(/\s+/g, " ").trim() ||
    $(".article-view-content").text().replace(/\s+/g, " ").trim() ||
    $(".fr-view").text().replace(/\s+/g, " ").trim() ||
    "";

  if (!title || body.length < 120) return null;

  const author =
    $(".user-name").first().text().replace(/\s+/g, " ").trim() ||
    $(".byline .name").first().text().replace(/\s+/g, " ").trim() ||
    $(".article-write").text().replace(/\s+/g, " ").trim().slice(0, 80) ||
    "Study Korea News";

  return {
    title,
    body: body.slice(0, 12_000),
    author,
    source_created_at: extractArticleDate(html),
    articleId: extractArticleId(url),
  };
}

export type ScrapeStudyKoreaNewsOptions = {
  maxPages?: number;
  maxArticles?: number;
};

export async function scrapeStudyKoreaNews(
  options: ScrapeStudyKoreaNewsOptions = {}
): Promise<ScrapeRunResult & { articles_found: number }> {
  resetClassifierRunCounter();
  const runId = await startPipelineRun(
    "study_korea_news",
    `Study Korea News · ${STUDY_KOREA_NEWS_LIST_URL}`
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
    const list = await collectStudyKoreaNewsUrls(
      options.maxPages ?? DEFAULT_MAX_PAGES
    );
    const toProcess = options.maxArticles
      ? list.slice(0, options.maxArticles)
      : list;
    result.collected = toProcess.length;
    result.articles_found = list.length;

    console.log(
      `[study-korea-news] processing ${toProcess.length} / ${list.length} articles`
    );

    for (const item of toProcess) {
      result.processed++;
      try {
        const html = await fetchHtml(item.url, 15_000);
        const parsed = parseStudyKoreaNewsArticlePage(html, item.url);
        if (!parsed) {
          result.skipped++;
          result.errors.push(`parse_empty:${item.articleId}`);
          continue;
        }

        const lang = detectLanguage(`${parsed.title}\n${parsed.body}`);

        const routeResult = await routeScrapedPost(
          scrapedPostFromRaw({
            source: "study_korea_news",
            source_id: `study-korea-news-${parsed.articleId}`,
            title: parsed.title,
            content: parsed.body,
            url: item.url,
            author: parsed.author,
            language: lang,
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
        console.error(`[study-korea-news] failed ${item.url}:`, msg);
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
    `[study-korea-news] done admissions=${result.routed_admissions} review=${result.routed_review} general=${result.routed_general}`
  );

  return result;
}
