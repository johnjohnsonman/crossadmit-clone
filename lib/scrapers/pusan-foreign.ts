/**
 * Pusan National University Channel PNU PMI scraper.
 * Search list: https://channelpnu.pusan.ac.kr/news/articleList.html?sc_word=PMI
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

export const PUSAN_FOREIGN_LIST_URL =
  "https://channelpnu.pusan.ac.kr/news/articleList.html?sc_word=PMI";
const PUSAN_FOREIGN_ORIGIN = "https://channelpnu.pusan.ac.kr";
const DEFAULT_MAX_PAGES = 8;

function extractArticleId(url: string): string {
  const idxno = new URL(url).searchParams.get("idxno");
  return idxno?.trim() || slugId(url);
}

export async function collectPusanForeignUrls(
  maxPages = DEFAULT_MAX_PAGES
): Promise<OfficialSeriesListItem[]> {
  const seen = new Set<string>();
  const items: OfficialSeriesListItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const listUrl = `${PUSAN_FOREIGN_LIST_URL}&page=${page}`;
    const html = await fetchHtml(listUrl, 20_000);
    const $ = loadHtml(html);
    let added = 0;

    $("a[href*='articleView.html?idxno=']").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href) return;

      const url = toAbsoluteUrl(PUSAN_FOREIGN_ORIGIN, href);
      const articleId = extractArticleId(url);
      if (seen.has(articleId)) return;

      const title = normalizeWhitespace($(el).text());
      if (!title || !title.startsWith("[PMI]")) return;

      seen.add(articleId);
      items.push({ url, title, articleId });
      added++;
    });

    console.log(`[pusan-foreign] list page ${page}: +${added} (total ${items.length})`);
    if (added === 0) break;
  }

  return items;
}

export function parsePusanForeignArticlePage(
  html: string,
  item: OfficialSeriesListItem
): ParsedOfficialSeriesArticle | null {
  const $ = loadHtml(html);
  const text = normalizeWhitespace($("body").text());
  const title =
    normalizeWhitespace($("meta[property='og:title']").attr("content") || "") ||
    normalizeWhitespace($("h3").eq(1).text()) ||
    item.title;

  let body = text;
  const titleIdx = body.indexOf(title);
  if (titleIdx >= 0) {
    body = body.slice(titleIdx + title.length).trim();
  }
  body = body.replace(
    /^-\s*기자명\s*.+?\s*-\s*입력\s*\d{4}\.\d{2}\.\d{2}\s*\d{2}:\d{2}\s*-\s*댓글\s*\d+/,
    ""
  );
  body = cutBeforeMarker(body, [
    "Reporter ",
    "Translated by",
    "#### 관련기사",
    "#### 키워드",
    "저작권자",
    "비밀번호",
  ]);
  body = normalizeWhitespace(body);

  if (body.length < 120) return null;

  const author =
    text.match(/기자명\s+(.+?)\s+입력/)?.[1]?.trim() || "Channel PNU";
  const source_created_at =
    parseIsoDate(text.match(/입력\s*(\d{4}\.\d{2}\.\d{2})/)?.[1] || "") || null;

  return {
    title,
    body: body.slice(0, 12_000),
    author,
    source_created_at,
    articleId: item.articleId,
  };
}

export async function scrapePusanForeign(
  options: ScrapeOfficialSeriesOptions = {}
) {
  return runOfficialSeriesScraper(
    {
      source: "pusan_foreign",
      label: "Pusan International",
      boardListUrl: PUSAN_FOREIGN_LIST_URL,
      language: "en",
      defaultMaxPages: DEFAULT_MAX_PAGES,
      collect: collectPusanForeignUrls,
      parse: parsePusanForeignArticlePage,
    },
    options
  );
}
