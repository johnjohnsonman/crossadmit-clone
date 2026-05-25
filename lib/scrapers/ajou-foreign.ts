/**
 * Ajou University foreign exchange interview scraper.
 * Board: https://www.ajou.ac.kr/gb/tv/student-tv.do
 */
import { fetchHtml, loadHtml, slugId } from "@/lib/pipeline/study-korea/fetch-html";
import {
  cutBeforeMarker,
  normalizeWhitespace,
  parseIsoDate,
  runOfficialSeriesScraper,
  type OfficialSeriesListItem,
  type ParsedOfficialSeriesArticle,
  type ScrapeOfficialSeriesOptions,
} from "@/lib/scrapers/official-series-helper";

export const AJOU_FOREIGN_LIST_URL =
  "https://www.ajou.ac.kr/gb/tv/student-tv.do";
const DEFAULT_MAX_PAGES = 4;
const PAGE_SIZE = 10;
const AJOU_TARGET_TITLE = /(외국인|교환학생)/;

function extractArticleId(url: string): string {
  const articleNo = new URL(url).searchParams.get("articleNo");
  return articleNo?.trim() || slugId(url);
}

export async function collectAjouForeignUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<OfficialSeriesListItem[]> {
  const seen = new Set<string>();
  const items: OfficialSeriesListItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const offset = (page - 1) * PAGE_SIZE;
    const listUrl =
      page === 1
        ? AJOU_FOREIGN_LIST_URL
        : `${AJOU_FOREIGN_LIST_URL}?article.offset=${offset}`;
    const html = await fetchHtml(listUrl, 20_000);
    const $ = loadHtml(html);
    let added = 0;

    $("a[href*='articleNo=']").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;

      const url = new URL(href, AJOU_FOREIGN_LIST_URL).toString();
      const articleId = extractArticleId(url);
      if (seen.has(articleId)) return;

      const title = normalizeWhitespace($(el).text());
      if (!title || !AJOU_TARGET_TITLE.test(title)) return;

      seen.add(articleId);
      items.push({ url, title, articleId, author: "아주대학교 글로벌경영학과" });
      added++;
    });

    console.log(`[ajou-foreign] list page ${page}: +${added} (total ${items.length})`);
    if (added === 0) break;
  }

  return items;
}

export function parseAjouForeignArticlePage(
  html: string,
  item: OfficialSeriesListItem
): ParsedOfficialSeriesArticle | null {
  const $ = loadHtml(html);
  const text = normalizeWhitespace($("body").text());
  const title =
    normalizeWhitespace($("title").text())
      .replace(/\s*\|\s*아주대학교 글로벌경영학과\s*$/i, "")
      .replace(/^NEW\s+/i, "")
      .trim() || item.title;

  let body = text;
  const titleIdx = body.indexOf(title);
  if (titleIdx >= 0) {
    body = body.slice(titleIdx + title.length).trim();
  }
  body = body.replace(/^-\s*\d{4}-\d{2}-\d{2}\s*-\s*\d+/, "");
  body = cutBeforeMarker(body, ["이전글", "다음글"]);
  body = normalizeWhitespace(body);

  if (body.length < 60) {
    body = `Official Ajou University student TV interview page. ${title}. Video-based interview page with limited on-page text content.`;
  }

  const source_created_at =
    parseIsoDate(text.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || "") || null;

  return {
    title,
    body: body.slice(0, 12_000),
    author: item.author || "아주대학교 글로벌경영학과",
    source_created_at,
    articleId: item.articleId,
  };
}

export async function scrapeAjouForeign(
  options: ScrapeOfficialSeriesOptions = {}
) {
  return runOfficialSeriesScraper(
    {
      source: "ajou_foreign",
      label: "Ajou Foreign Interviews",
      boardListUrl: AJOU_FOREIGN_LIST_URL,
      language: "ko",
      defaultMaxPages: DEFAULT_MAX_PAGES,
      collect: collectAjouForeignUrls,
      parse: parseAjouForeignArticlePage,
    },
    options
  );
}
