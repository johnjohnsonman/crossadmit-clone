/**
 * Korea.net Honorary Reporters — GKS scholarship story scraper.
 * List: board/list.do?searchtxt=GKS (requires HONORARY_REPORTERS_PASS_KEY)
 */
import { resetClassifierRunCounter } from "@/lib/classifiers/classifier-usage";
import { loadHtml, slugId } from "@/lib/pipeline/study-korea/fetch-html";
import {
  finishPipelineRun,
  startPipelineRun,
} from "@/lib/pipeline/study-korea/runs";
import type { ScrapeRunResult } from "@/lib/pipeline/study-korea/types";
import {
  fetchKoreaNetHr,
  getHonoraryReportersPassKey,
  KOREA_NET_HR_ORIGIN,
  loginHonoraryReporters,
} from "@/lib/scrapers/korea-net-client";
import {
  routeScrapedPost,
  scrapedPostFromRaw,
} from "@/lib/scrapers/router";
import { setActivePipelineRunId } from "@/lib/scrapers/run-context";

export const KOREA_NET_GKS_LIST_URL = `${KOREA_NET_HR_ORIGIN}/board/list.do?searchtxt=GKS&searchtp=all&articlecate=1&tpln=1`;

const BOARD_NO_RE = /board_no=(\d+)/i;
const GKS_RE = /\bGKS\b|Global Korea Scholarship/i;
const FETCH_DELAY_MS = 500;
const DEFAULT_MAX_PAGES = 20;

const DDG_QUERIES = [
  "site:honoraryreporters.korea.net GKS",
  'site:honoraryreporters.korea.net "Global Korea Scholarship"',
  "site:honoraryreporters.korea.net GKS scholar Korea",
  "site:honoraryreporters.korea.net GKS scholarship recipient",
];

export type KoreaNetGksListItem = {
  url: string;
  title: string;
  articleId: string;
};

export type ParsedKoreaNetGksArticle = {
  title: string;
  body: string;
  author: string;
  source_created_at: string | null;
  articleId: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function extractBoardNo(url: string): string {
  const m = url.match(BOARD_NO_RE);
  return m?.[1] ?? slugId(url);
}

export function normalizeArticleUrl(boardNo: string): string {
  return `${KOREA_NET_HR_ORIGIN}/board/detail.do?articlecate=1&board_no=${boardNo}&tpln=1`;
}

export function isGksRelatedText(text: string): boolean {
  return GKS_RE.test(text);
}

function decodeDdgHref(href: string): string {
  if (!href.includes("uddg=")) return href;
  const m = href.match(/uddg=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : href;
}

/** DuckDuckGo HTML (no passKey) — discovery only */
async function discoverViaDdg(): Promise<KoreaNetGksListItem[]> {
  const byId = new Map<string, KoreaNetGksListItem>();

  for (const query of DDG_QUERIES) {
    for (let offset = 0; offset < 60; offset += 30) {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}${offset ? `&s=${offset}` : ""}`;
      try {
        const res = await fetch(searchUrl, {
          headers: { "User-Agent": BROWSER_HEADERS_UA },
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) break;
        const $ = loadHtml(await res.text());
        let added = 0;
        $("a.result__a").each((_, el) => {
          const rawHref = $(el).attr("href") || "";
          const href = decodeDdgHref(rawHref);
          if (!href.includes("honoraryreporters.korea.net")) return;
          const m = href.match(BOARD_NO_RE);
          if (!m) return;
          const articleId = m[1]!;
          if (byId.has(articleId)) return;
          const title = $(el).text().replace(/\s+/g, " ").trim();
          byId.set(articleId, {
            url: normalizeArticleUrl(articleId),
            title: title || `GKS article ${articleId}`,
            articleId,
          });
          added++;
        });
        console.log(`[korea-net-gks] DDG "${query}" s=${offset}: +${added}`);
        if (added === 0) break;
      } catch (e) {
        console.warn(`[korea-net-gks] DDG skip:`, e instanceof Error ? e.message : e);
        break;
      }
      await sleep(400);
    }
  }

  return [...byId.values()];
}

const BROWSER_HEADERS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function extractFromListHtml(html: string): KoreaNetGksListItem[] {
  const $ = loadHtml(html);
  const byId = new Map<string, KoreaNetGksListItem>();

  $("a[href*='detail.do']").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;
    const m = href.match(BOARD_NO_RE);
    if (!m) return;
    const articleId = m[1]!;
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (!title || title.length < 4) return;
    const url = href.startsWith("http")
      ? href.split("#")[0]!
      : `${KOREA_NET_HR_ORIGIN}${href.startsWith("/") ? href.split("#")[0] : `/${href.split("#")[0]}`}`;
    if (!byId.has(articleId)) {
      byId.set(articleId, {
        url: normalizeArticleUrl(articleId),
        title,
        articleId,
      });
    }
  });

  return [...byId.values()];
}

/** GKS 검색 목록 + DDG 보조 (로그인 후 list 최대 maxPages) */
export async function collectGksArticleUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<KoreaNetGksListItem[]> {
  const passKey = getHonoraryReportersPassKey();
  await loginHonoraryReporters(passKey);

  const byId = new Map<string, KoreaNetGksListItem>();

  const add = (items: KoreaNetGksListItem[], label: string) => {
    let n = 0;
    for (const item of items) {
      if (!byId.has(item.articleId)) {
        byId.set(item.articleId, item);
        n++;
      }
    }
    if (n > 0) console.log(`[korea-net-gks] ${label}: +${n} (total ${byId.size})`);
    return n;
  };

  for (let page = 1; page <= maxPages; page++) {
    const path = `/board/list.do?searchtxt=GKS&searchtp=all&articlecate=1&pageidx=${page}&tpln=1`;
    const { html } = await fetchKoreaNetHr(path);
    if (html.includes("Incorrect password") || html.includes('name="passKey"')) {
      throw new Error("Honorary Reporters session lost (passKey page)");
    }
    const items = extractFromListHtml(html);
    const added = add(items, `list p${page}`);
    if (added === 0) break;
    await sleep(300);
  }

  const ddg = await discoverViaDdg();
  add(ddg, "DDG discovery");

  return [...byId.values()];
}

function detectLanguage(text: string): string {
  if (/[가-힣]{8,}/.test(text)) return "ko";
  if (/[\u0600-\u06FF]{12,}/.test(text)) return "ar";
  if (/[\u0400-\u04FF]{12,}/.test(text)) return "ru";
  if (/[\u4e00-\u9fff]{12,}/.test(text)) return "zh";
  return "en";
}

export function parseKoreaNetGksArticlePage(
  html: string,
  url: string
): ParsedKoreaNetGksArticle | null {
  if (html.includes("Incorrect password") || html.includes('name="passKey"')) {
    return null;
  }

  const $ = loadHtml(html);
  const title =
    $("h1, h2, h3, .view_tit, .tit, .subject")
      .filter((_, el) => {
        const t = $(el).text().replace(/\s+/g, " ").trim();
        return t.length > 10 && !/News & Contents|Honorary Reporters/i.test(t);
      })
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim() ||
    $("meta[property='og:title']").attr("content")?.trim() ||
    "";

  const body =
    $(".view_cont, .view_content, .board_view_cont, .board_view .cont")
      .text()
      .replace(/\s+/g, " ")
      .trim() ||
    $("#content, .content, article")
      .text()
      .replace(/\s+/g, " ")
      .trim() ||
    "";

  const combined = `${title}\n${body}`;
  if (!title || body.length < 120 || !isGksRelatedText(combined)) return null;

  const dateMatch =
    html.match(/\b(20\d{2})[.\-/](\d{2})[.\-/](\d{2})\b/) ||
    html.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const source_created_at = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`
    : null;

  const authorMatch = body.match(
    /By Honorary Reporter\s+(.+?)(?:\s+from\s+|\s+Photo\b|$)/i
  );
  const author = authorMatch?.[1]?.trim() || "Korea.net Honorary Reporter";

  return {
    title,
    body: body.slice(0, 12_000),
    author,
    source_created_at,
    articleId: extractBoardNo(url),
  };
}

export type ScrapeKoreaNetGksOptions = {
  maxPages?: number;
  maxArticles?: number;
};

export async function scrapeKoreaNetGksInterviews(
  options: ScrapeKoreaNetGksOptions = {}
): Promise<ScrapeRunResult & { articles_found: number }> {
  resetClassifierRunCounter();
  const runId = await startPipelineRun(
    "korea_net_gks",
    `Korea.net Honorary Reporters GKS · ${KOREA_NET_GKS_LIST_URL}`
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
    const list = await collectGksArticleUrls(options.maxPages ?? DEFAULT_MAX_PAGES);
    const toProcess = options.maxArticles
      ? list.slice(0, options.maxArticles)
      : list;
    result.collected = toProcess.length;
    result.articles_found = list.length;

    console.log(
      `[korea-net-gks] processing ${toProcess.length} / ${list.length} GKS articles`
    );

    for (const item of toProcess) {
      result.processed++;
      try {
        const { html } = await fetchKoreaNetHr(item.url);
        const parsed = parseKoreaNetGksArticlePage(html, item.url);
        if (!parsed) {
          result.skipped++;
          result.errors.push(`parse_empty:${item.articleId}`);
          continue;
        }

        const lang = detectLanguage(parsed.body);

        const routeResult = await routeScrapedPost(
          scrapedPostFromRaw({
            source: "korea_net_gks",
            source_id: `korea-net-gks-${parsed.articleId}`,
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
        console.error(`[korea-net-gks] failed ${item.url}:`, msg);
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
    `[korea-net-gks] done admissions=${result.routed_admissions} review=${result.routed_review} general=${result.routed_general}`
  );

  return result;
}
