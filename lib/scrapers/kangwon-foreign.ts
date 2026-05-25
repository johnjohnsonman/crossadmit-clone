/**
 * Kangwon National University Student of the Month scraper.
 * Board: https://oiaknu.kangwon.ac.kr/oiaknu/oia/campus-map001.do
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

export const KANGWON_FOREIGN_LIST_URL =
  "https://oiaknu.kangwon.ac.kr/oiaknu/oia/campus-map001.do";
const DEFAULT_MAX_PAGES = 6;
const PAGE_SIZE = 12;

function extractArticleId(url: string): string {
  const articleNo = new URL(url).searchParams.get("articleNo");
  return articleNo?.trim() || slugId(url);
}

export async function collectKangwonForeignUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<OfficialSeriesListItem[]> {
  const seen = new Set<string>();
  const items: OfficialSeriesListItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const offset = (page - 1) * PAGE_SIZE;
    const listUrl =
      page === 1
        ? KANGWON_FOREIGN_LIST_URL
        : `${KANGWON_FOREIGN_LIST_URL}?article.offset=${offset}&articleLimit=${PAGE_SIZE}&mode=list`;
    const html = await fetchHtml(listUrl, 20_000);
    const $ = loadHtml(html);
    let added = 0;

    $("a[href*='articleNo=']").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;

      const url = new URL(href, KANGWON_FOREIGN_LIST_URL).toString();
      const articleId = extractArticleId(url);
      if (seen.has(articleId)) return;

      const title = normalizeWhitespace($(el).text());
      if (!title) return;

      seen.add(articleId);
      items.push({ url, title, articleId });
      added++;
    });

    console.log(
      `[kangwon-foreign] list page ${page}: +${added} (total ${items.length})`
    );
    if (added === 0) break;
  }

  return items;
}

export function parseKangwonForeignArticlePage(
  html: string,
  item: OfficialSeriesListItem
): ParsedOfficialSeriesArticle | null {
  const $ = loadHtml(html);
  const text = normalizeWhitespace($("body").text());
  const title = item.title;

  let body = text;
  const titleIdx = body.indexOf(title);
  if (titleIdx >= 0) {
    body = body.slice(titleIdx + title.length).trim();
  }
  body = body.replace(
    /^-\s*작성자\s*.+?\s*-\s*작성일\s*\d{4}\.\d{2}\.\d{2}\s*-\s*조회\s*\d+/,
    ""
  );
  body = cutBeforeMarker(body, ["이전글", "다음글"]);
  body = normalizeWhitespace(body);

  if (body.length < 120) return null;

  const author =
    text.match(/작성자\s+(.+?)\s+작성일/)?.[1]?.trim() || "KNU OIA";
  const source_created_at =
    parseIsoDate(text.match(/작성일\s*(\d{4}\.\d{2}\.\d{2})/)?.[1] || "") || null;

  return {
    title,
    body: body.slice(0, 12_000),
    author,
    source_created_at,
    articleId: item.articleId,
  };
}

export async function scrapeKangwonForeign(
  options: ScrapeOfficialSeriesOptions = {}
) {
  return runOfficialSeriesScraper(
    {
      source: "kangwon_foreign",
      label: "Kangwon Student of Month",
      boardListUrl: KANGWON_FOREIGN_LIST_URL,
      language: "en",
      defaultMaxPages: DEFAULT_MAX_PAGES,
      collect: collectKangwonForeignUrls,
      parse: parseKangwonForeignArticlePage,
    },
    options
  );
}
