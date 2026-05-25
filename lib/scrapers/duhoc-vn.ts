/**
 * Vietnamese study-abroad agency blogs for Korea admissions stories.
 * Current enabled source: duhocsunny.edu.vn
 * Alpha is kept as a skipped target because robots/detail connectivity
 * could not be reliably verified from this environment.
 */
import { resetClassifierRunCounter } from "@/lib/classifiers/classifier-usage";
import {
  BROWSER_HEADERS,
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
import * as https from "https";

type DuhocSourceId = "duhoc_alpha" | "duhoc_sunny";

type DuhocSource = {
  id: DuhocSourceId;
  label: string;
  baseUrl: string;
  categories: string[];
  language: "vi";
  enabled: boolean;
  skipReason?: string;
};

type DuhocListItem = {
  url: string;
  title: string;
};

type DuhocArticle = {
  title: string;
  body: string;
  publishedAt: string | null;
};

export const TARGET_SOURCES: readonly DuhocSource[] = [
  {
    id: "duhoc_alpha",
    label: "Du Hoc Alpha",
    baseUrl: "https://duhocalpha.vn",
    categories: [],
    language: "vi",
    enabled: false,
    skipReason:
      "robots/detail connectivity could not be reliably verified from current environment",
  },
  {
    id: "duhoc_sunny",
    label: "Du Hoc Sunny",
    baseUrl: "https://duhocsunny.edu.vn",
    categories: [
      "https://duhocsunny.edu.vn/cam-nhan-hoc-vien/",
      "https://duhocsunny.edu.vn/p-hoc-vien/",
    ],
    language: "vi",
    enabled: true,
  },
] as const;

const FETCH_DELAY_MS = 1000;
const DETAIL_DELAY_MS = 600;
const MAX_PAGES_PER_CATEGORY = 5;

export type DuhocCollectStats = {
  source: DuhocSourceId;
  categories: number;
  pages_fetched: number;
  urls_found: number;
  urls_unique: number;
  skipped?: string;
  error?: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildCategoryPageUrl(base: string, page: number): string {
  if (page <= 1) return base;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}/page/${page}/`;
}

async function fetchHtmlWithRetry(
  url: string,
  timeoutMs = 20_000,
  retries = 2
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestHtml(url, timeoutMs);
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      await sleep(1200 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function requestHtml(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const headers = Object.fromEntries(
      Object.entries(BROWSER_HEADERS as Record<string, string>).map(([k, v]) => [
        k,
        String(v),
      ])
    );

    const req = https.get(
      url,
      { headers, timeout: timeoutMs },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && location) {
          res.resume();
          resolve(requestHtml(new URL(location, url).toString(), timeoutMs));
          return;
        }
        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error(`HTTP ${status} for ${url}`));
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve(body));
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error(`Timeout ${timeoutMs}ms for ${url}`));
    });
    req.on("error", reject);
  });
}

function normalizeUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString().split("#")[0]!;
  } catch {
    return href;
  }
}

function isSunnyArticleUrl(url: string): boolean {
  if (!url.startsWith("https://duhocsunny.edu.vn/")) return false;
  if (
    /\/(cam-nhan-hoc-vien|p-hoc-vien|blog|events|author|category|tag)\//i.test(
      url
    )
  ) {
    return false;
  }
  const path = new URL(url).pathname;
  return path.split("/").filter(Boolean).length === 1;
}

function parseSunnyListPage(html: string, baseUrl: string): DuhocListItem[] {
  const $ = loadHtml(html);
  const out = new Map<string, DuhocListItem>();

  $("article").each((_, el) => {
    const link =
      $(el).find("h1 a, h2 a, h3 a, .elementor-heading-title a").first();
    const href = link.attr("href")?.trim();
    const title = link.text().replace(/\s+/g, " ").trim();
    if (!href || !title) return;
    const url = normalizeUrl(href, baseUrl);
    if (!isSunnyArticleUrl(url)) return;
    out.set(url, { url, title });
  });

  if (out.size === 0) {
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      const title = $(el).text().replace(/\s+/g, " ").trim();
      if (!href || !title) return;
      const url = normalizeUrl(href, baseUrl);
      if (!isSunnyArticleUrl(url)) return;
      if (
        /(cảm nhận học viên|thục uyên|du học hàn quốc giá rẻ)/i.test(title)
      ) {
        out.set(url, { url, title });
      }
    });
  }

  return [...out.values()];
}

function extractPublishedAt($: ReturnType<typeof loadHtml>): string | null {
  const raw =
    $("time").first().attr("datetime")?.trim() ||
    $("meta[property='article:published_time']").attr("content")?.trim() ||
    $("meta[property='og:updated_time']").attr("content")?.trim() ||
    "";
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function trimSunnyBodyText(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const stopMarkers = [
    "* Bài viết liên quan:",
    "Đăng ký tư vấn thông tin du học",
    "Đăng ký tư vấn miễn phí",
    "Bài viết mới nhất",
  ];
  let out = cleaned;
  for (const marker of stopMarkers) {
    const idx = out.indexOf(marker);
    if (idx > 0) {
      out = out.slice(0, idx).trim();
    }
  }
  return out;
}

function extractSunnyPublishedAt(
  $: ReturnType<typeof loadHtml>,
  text: string
): string | null {
  const meta = extractPublishedAt($);
  if (meta) return meta;
  const m = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
}

function parseSunnyDetailPage(html: string): DuhocArticle | null {
  const $ = loadHtml(html);
  const title =
    $("h1").first().text().replace(/\s+/g, " ").trim() ||
    $("meta[property='og:title']").attr("content")?.trim() ||
    "";

  const body =
    trimSunnyBodyText($(".post-content").first().text()) ||
    trimSunnyBodyText($(".entry-content").text()) ||
    $(".elementor-widget-theme-post-content")
      .text()
      .replace(/\s+/g, " ")
      .trim() ||
    trimSunnyBodyText($("main").first().text()) ||
    "";

  if (!title || body.length < 120) return null;

  return {
    title,
    body: body.slice(0, 12_000),
    publishedAt: extractSunnyPublishedAt($, body),
  };
}

async function collectSourceUrls(
  source: DuhocSource,
  maxPages = MAX_PAGES_PER_CATEGORY
): Promise<{ items: DuhocListItem[]; stats: DuhocCollectStats }> {
  if (!source.enabled) {
    return {
      items: [],
      stats: {
        source: source.id,
        categories: source.categories.length,
        pages_fetched: 0,
        urls_found: 0,
        urls_unique: 0,
        skipped: source.skipReason,
      },
    };
  }

  const seen = new Map<string, DuhocListItem>();
  let pagesFetched = 0;
  let urlsFound = 0;

  for (const categoryUrl of source.categories) {
    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = buildCategoryPageUrl(categoryUrl, page);
      try {
        const html = await fetchHtmlWithRetry(pageUrl, 25_000, 2);
        pagesFetched++;
        const list = parseSunnyListPage(html, source.baseUrl);
        if (list.length === 0) break;
        urlsFound += list.length;
        for (const item of list) {
          if (!seen.has(item.url)) seen.set(item.url, item);
        }
        await sleep(FETCH_DELAY_MS);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/HTTP 404/i.test(msg) && page > 1) break;
        throw e;
      }
    }
  }

  return {
    items: [...seen.values()],
    stats: {
      source: source.id,
      categories: source.categories.length,
      pages_fetched: pagesFetched,
      urls_found: urlsFound,
      urls_unique: seen.size,
    },
  };
}

export type ScrapeDuhocVietnamOptions = {
  source?: DuhocSourceId;
  limit?: number;
};

export async function scrapeDuhocVietnam(
  options: ScrapeDuhocVietnamOptions = {}
): Promise<
  ScrapeRunResult & {
    articles_found: number;
    per_source: DuhocCollectStats[];
  }
> {
  resetClassifierRunCounter();
  const runId = await startPipelineRun("duhoc_vn", "Vietnamese study agencies");
  setActivePipelineRunId(runId);

  const result: ScrapeRunResult & {
    articles_found: number;
    per_source: DuhocCollectStats[];
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
    per_source: [],
  };

  try {
    const targets = TARGET_SOURCES.filter(
      (s) => !options.source || s.id === options.source
    );

    const allItems: Array<DuhocListItem & { source: DuhocSource }> = [];

    for (const source of targets) {
      try {
        const { items, stats } = await collectSourceUrls(source);
        result.per_source.push(stats);
        for (const item of items) allItems.push({ ...item, source });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        result.per_source.push({
          source: source.id,
          categories: source.categories.length,
          pages_fetched: 0,
          urls_found: 0,
          urls_unique: 0,
          skipped: "source collection failed",
          error: msg,
        });
        result.errors.push(`${source.id}: ${msg}`);
      }
    }

    const uniqueByUrl = new Map<string, DuhocListItem & { source: DuhocSource }>();
    for (const item of allItems) {
      if (!uniqueByUrl.has(item.url)) uniqueByUrl.set(item.url, item);
    }

    const uniqueItems = [...uniqueByUrl.values()];
    result.articles_found = uniqueItems.length;

    const limit = options.limit ?? 50;
    const toProcess = uniqueItems.slice(0, limit);
    result.collected = toProcess.length;

    console.log(
      `[duhoc_vn] processing ${toProcess.length} / ${uniqueItems.length} candidate articles`
    );

    for (const item of toProcess) {
      result.processed++;
      try {
        const html = await fetchHtmlWithRetry(item.url, 25_000, 2);
        const parsed = parseSunnyDetailPage(html);
        if (!parsed) {
          result.skipped++;
          result.errors.push(`parse_empty:${item.url}`);
          continue;
        }

        const routeResult = await routeScrapedPost(
          scrapedPostFromRaw({
            source: item.source.id,
            source_id: `${item.source.id}-${slugId(item.url)}`,
            title: parsed.title,
            content: parsed.body,
            url: item.url,
            language: item.source.language,
            source_created_at: parsed.publishedAt,
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
        result.errors.push(`${item.url}: ${msg}`);
        console.error("[duhoc_vn] failed:", item.url, msg);
      }
      await sleep(DETAIL_DELAY_MS);
    }

    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status:
        result.failed > 0 && result.saved === 0
          ? "partial"
          : result.errors.length > 0 && result.saved === 0
            ? "partial"
          : result.failed > 0
            ? "partial"
            : "success",
      error_message: result.errors.slice(0, 8).join("; "),
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

  return result;
}
