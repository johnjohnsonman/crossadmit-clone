/**
 * SKKU foreign student webzine scraper.
 * Board: https://webzine.skku.edu/skkuzine/section/people02.do?mode=list
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

export const SKKU_FOREIGN_LIST_URL =
  "https://webzine.skku.edu/skkuzine/section/people02.do?mode=list";
const DEFAULT_MAX_PAGES = 8;
const PAGE_SIZE = 10;

function extractArticleId(url: string): string {
  const articleNo = new URL(url).searchParams.get("articleNo");
  return articleNo?.trim() || slugId(url);
}

export async function collectSkkuForeignUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<OfficialSeriesListItem[]> {
  const seen = new Set<string>();
  const items: OfficialSeriesListItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const offset = (page - 1) * PAGE_SIZE;
    const listUrl =
      page === 1
        ? SKKU_FOREIGN_LIST_URL
        : `${SKKU_FOREIGN_LIST_URL}&pager.offset=${offset}&pagerLimit=${PAGE_SIZE}`;
    const html = await fetchHtml(listUrl, 20_000);
    const $ = loadHtml(html);
    let added = 0;

    $("a[href*='articleNo=']").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;

      const url = new URL(href, SKKU_FOREIGN_LIST_URL).toString();
      const articleId = extractArticleId(url);
      if (seen.has(articleId)) return;

      const title = normalizeWhitespace($(el).text());
      if (!title || !articleId) return;

      seen.add(articleId);
      items.push({ url, title, articleId });
      added++;
    });

    console.log(`[skku-foreign] list page ${page}: +${added} (total ${items.length})`);
    if (added === 0) break;
  }

  return items;
}

export function parseSkkuForeignArticlePage(
  html: string,
  item: OfficialSeriesListItem
): ParsedOfficialSeriesArticle | null {
  const $ = loadHtml(html);
  const text = normalizeWhitespace($("body").text());
  const title =
    normalizeWhitespace($("h2").first().text()) ||
    normalizeWhitespace($("meta[property='og:title']").attr("content") || "") ||
    item.title;

  if (!title || !text.includes(title)) return null;

  let body = text.slice(text.indexOf(title) + title.length).trim();
  body = body.replace(
    /^-\s*\d+호\s*-\s*기사입력\s*\d{4}\.\d{2}\.\d{2}\s*-\s*취재\s*.+?\s*-\s*편집\s*.+?\s*-\s*조회수\s*\d+/,
    ""
  );
  body = cutBeforeMarker(body, ["| No. |", "서울특별시", "Copyright"]);
  body = normalizeWhitespace(body);

  if (body.length < 120) return null;

  const author =
    text.match(/취재\s+(.+?)\s+기자/)?.[1]?.trim() || "SKKU Webzine";
  const source_created_at =
    parseIsoDate(text.match(/기사입력\s*(\d{4}\.\d{2}\.\d{2})/)?.[1] || "") || null;

  return {
    title,
    body: body.slice(0, 12_000),
    author,
    source_created_at,
    articleId: item.articleId,
  };
}

export async function scrapeSkkuForeign(
  options: ScrapeOfficialSeriesOptions = {}
) {
  return runOfficialSeriesScraper(
    {
      source: "skku_foreign",
      label: "SKKU International",
      boardListUrl: SKKU_FOREIGN_LIST_URL,
      language: "ko",
      defaultMaxPages: DEFAULT_MAX_PAGES,
      collect: collectSkkuForeignUrls,
      parse: parseSkkuForeignArticlePage,
    },
    options
  );
}
