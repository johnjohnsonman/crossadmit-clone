/**
 * Sogang GSIS international student story scraper.
 * Board: https://gsis.sogang.ac.kr/front/cmsboardlist.do?bbsConfigFK=5310&siteId=gsis
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

export const SOGANG_FOREIGN_LIST_URL =
  "https://gsis.sogang.ac.kr/front/cmsboardlist.do?bbsConfigFK=5310&siteId=gsis";
const SOGANG_FOREIGN_ORIGIN = "https://gsis.sogang.ac.kr";
const DEFAULT_MAX_PAGES = 6;

function extractArticleId(url: string): string {
  const pkid = new URL(url).searchParams.get("pkid");
  return pkid?.trim() || slugId(url);
}

function splitTitleAuthor(raw: string): { title: string; author: string } {
  const cleaned = normalizeWhitespace(raw);
  const parts = cleaned.split(/\s*[|/]\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      title: parts.slice(0, -1).join(" / "),
      author: parts[parts.length - 1],
    };
  }
  return { title: cleaned, author: "Sogang GSIS Student" };
}

export async function collectSogangForeignUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<OfficialSeriesListItem[]> {
  const seen = new Set<string>();
  const items: OfficialSeriesListItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const listUrl =
      page === 1
        ? SOGANG_FOREIGN_LIST_URL
        : `${SOGANG_FOREIGN_LIST_URL}&currentPage=${page}`;
    const html = await fetchHtml(listUrl, 20_000);
    const $ = loadHtml(html);
    let added = 0;

    $("a[href*='cmsboardview.do'][href*='pkid=']").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;

      const url = toAbsoluteUrl(SOGANG_FOREIGN_ORIGIN, href);
      const articleId = extractArticleId(url);
      if (seen.has(articleId)) return;

      const rawTitle = normalizeWhitespace($(el).text());
      if (!rawTitle) return;

      seen.add(articleId);
      items.push({ url, title: rawTitle, articleId });
      added++;
    });

    console.log(`[sogang-foreign] list page ${page}: +${added} (total ${items.length})`);
    if (added === 0) break;
  }

  return items;
}

export function parseSogangForeignArticlePage(
  html: string,
  item: OfficialSeriesListItem
): ParsedOfficialSeriesArticle | null {
  const $ = loadHtml(html);
  const text = normalizeWhitespace($("body").text());
  const split = splitTitleAuthor(item.title);
  const title = split.title || item.title;

  let body = text;
  const titleIdx = body.indexOf(title);
  if (titleIdx >= 0) {
    body = body.slice(titleIdx + title.length).trim();
  }
  body = body.replace(/^국제대학원\s*\d{4}\.\d{2}\.\d{2}\s*\d{2}:\d{2}:\d{2}/, "");
  body = cutBeforeMarker(body, ["첨부파일", "다음글", "이전글"]);
  body = normalizeWhitespace(body);

  if (body.length < 120) return null;

  const source_created_at =
    parseIsoDate(text.match(/국제대학원\s*(\d{4}\.\d{2}\.\d{2})/)?.[1] || "") || null;

  return {
    title,
    body: body.slice(0, 12_000),
    author: split.author,
    source_created_at,
    articleId: item.articleId,
  };
}

export async function scrapeSogangForeign(
  options: ScrapeOfficialSeriesOptions = {}
) {
  return runOfficialSeriesScraper(
    {
      source: "sogang_foreign",
      label: "Sogang International",
      boardListUrl: SOGANG_FOREIGN_LIST_URL,
      language: "en",
      defaultMaxPages: DEFAULT_MAX_PAGES,
      collect: collectSogangForeignUrls,
      parse: parseSogangForeignArticlePage,
    },
    options
  );
}
