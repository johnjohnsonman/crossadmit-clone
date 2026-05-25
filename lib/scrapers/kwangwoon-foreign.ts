/**
 * Kwangwoon University Alumni Interview Relay scraper.
 * Board: https://oia.kw.ac.kr/career/interview.php
 */
import { fetchHtml, loadHtml, slugId } from "@/lib/pipeline/study-korea/fetch-html";
import {
  cutBeforeMarker,
  normalizeWhitespace,
  parseIsoDate,
  runOfficialSeriesScraper,
  toAbsoluteUrl,
  type OfficialSeriesListItem,
  type ParsedOfficialSeriesArticle,
  type ScrapeOfficialSeriesOptions,
} from "@/lib/scrapers/official-series-helper";

export const KWANGWOON_FOREIGN_LIST_URL =
  "https://oia.kw.ac.kr/career/interview.php";
const KWANGWOON_FOREIGN_ORIGIN = "https://oia.kw.ac.kr";
const DEFAULT_MAX_PAGES = 3;

function extractArticleId(url: string): string {
  const uid = new URL(url).searchParams.get("UID");
  return uid?.trim() || slugId(url);
}

export async function collectKwangwoonForeignUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<OfficialSeriesListItem[]> {
  const seen = new Set<string>();
  const items: OfficialSeriesListItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const listUrl =
      page === 1
        ? KWANGWOON_FOREIGN_LIST_URL
        : `${KWANGWOON_FOREIGN_LIST_URL}?CURRENT_PAGE=${page}`;
    const html = await fetchHtml(listUrl, 20_000);
    const $ = loadHtml(html);
    let added = 0;

    $("a[href*='interview.php'][href*='UID=']").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;

      const url = toAbsoluteUrl(KWANGWOON_FOREIGN_ORIGIN, href);
      const articleId = extractArticleId(url);
      if (seen.has(articleId)) return;

      const title = normalizeWhitespace($(el).text());
      if (!title) return;

      seen.add(articleId);
      items.push({ url, title, articleId });
      added++;
    });

    console.log(
      `[kwangwoon-foreign] list page ${page}: +${added} (total ${items.length})`
    );
    if (added === 0) break;
  }

  return items;
}

export function parseKwangwoonForeignArticlePage(
  html: string,
  item: OfficialSeriesListItem
): ParsedOfficialSeriesArticle | null {
  const $ = loadHtml(html);
  const text = normalizeWhitespace($("body").text());
  const title =
    normalizeWhitespace($("h3").first().text()) ||
    item.title;

  let body = text;
  const titleIdx = body.indexOf(title);
  if (titleIdx >= 0) {
    body = body.slice(titleIdx + title.length).trim();
  }
  body = body.replace(/^-+\s*.+?\s*-\s*\d{4}-\d{2}-\d{2}\s*-\s*\d+/, "");
  body = cutBeforeMarker(body, ["목록", "비밀번호 확인"]);
  body = normalizeWhitespace(body);

  if (body.length < 120) return null;

  const afterTitle = text.slice(text.indexOf(title) + title.length).trim();
  const metaMatch = afterTitle.match(/^-\s*(.+?)\s*-\s*(\d{4}-\d{2}-\d{2})\s*-\s*\d+/);
  const author = metaMatch?.[1]?.trim() || "Kwangwoon OIA";
  const source_created_at = parseIsoDate(metaMatch?.[2] || "") || null;

  return {
    title,
    body: body.slice(0, 12_000),
    author,
    source_created_at,
    articleId: item.articleId,
  };
}

export async function scrapeKwangwoonForeign(
  options: ScrapeOfficialSeriesOptions = {}
) {
  return runOfficialSeriesScraper(
    {
      source: "kwangwoon_foreign",
      label: "Kwangwoon Alumni Relay",
      boardListUrl: KWANGWOON_FOREIGN_LIST_URL,
      language: "en",
      defaultMaxPages: DEFAULT_MAX_PAGES,
      collect: collectKwangwoonForeignUrls,
      parse: parseKwangwoonForeignArticlePage,
    },
    options
  );
}
