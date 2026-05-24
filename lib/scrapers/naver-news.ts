/**
 * Naver News scraper — routed via runRoutedBatch → routeScrapedPost().
 */
import { naverPostSourceId, normalizeNaverPostUrl } from "@/lib/pipeline/study-korea/naver-url";
import { naverHeaders, stripNaverHtml } from "@/lib/pipeline/study-korea/naver-api";
import { runRoutedBatch } from "@/lib/scrapers/run-routed-batch";
import { EMPTY_SCRAPE_RESULT } from "@/lib/pipeline/study-korea/types";

const NEWS_QUERIES = [
  { query: "한국유학+외국인", display: 20 },
  { query: "GKS장학금", display: 10 },
  { query: "외국인유학생+한국대학", display: 10 },
];

interface NaverNewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

function parsePubDate(pubDate: string): string | null {
  try {
    const d = new Date(pubDate);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

export async function scrapeNaverNews() {
  const headers = naverHeaders();
  if (!headers) {
    console.log("[scraper:naver_news] skipped — NAVER credentials not set");
    return {
      ...EMPTY_SCRAPE_RESULT,
      errors: ["NAVER credentials not configured"],
    };
  }

  const items = [];
  const seen = new Set<string>();

  for (const { query, display } of NEWS_QUERIES) {
    try {
      const apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=date`;
      const res = await fetch(apiUrl, { headers, cache: "no-store" });
      if (!res.ok) {
        console.warn(`[scraper:naver_news] ${query}: HTTP ${res.status}`);
        continue;
      }
      const json = (await res.json()) as { items?: NaverNewsItem[] };
      for (const item of json.items ?? []) {
        const postUrl = normalizeNaverPostUrl(item.link);
        const source_id = naverPostSourceId(postUrl, "news");
        if (!postUrl || seen.has(source_id)) continue;
        seen.add(source_id);
        items.push({
          source_id,
          title: stripNaverHtml(item.title),
          content: stripNaverHtml(item.description),
          url: postUrl,
          author: "naver_news",
          language: "ko",
          source_created_at: parsePubDate(item.pubDate),
        });
      }
    } catch (e) {
      console.warn(
        `[scraper:naver_news] query "${query}":`,
        e instanceof Error ? e.message : e
      );
    }
  }

  console.log(`[scraper:naver_news] total unique: ${items.length}`);
  return runRoutedBatch(
    "naver_news",
    "naver_news",
    items,
    NEWS_QUERIES.map((q) => q.query).join(" | ")
  );
}
