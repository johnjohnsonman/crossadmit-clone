import { processAndSaveItems, type RawStudyKoreaItem } from "./process-items";
import { naverPostSourceId, normalizeNaverPostUrl } from "./naver-url";
import { isNaverConfigured, naverHeaders, stripNaverHtml } from "./naver-api";

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

export async function scrapeNaverNewsStudyKorea() {
  const headers = naverHeaders();
  if (!headers) {
    console.log("[naver_news] skipped — NAVER credentials not set");
    return {
      collected: 0,
      processed: 0,
      saved: 0,
      failed: 0,
      skipped: 0,
      errors: ["NAVER credentials not configured"],
    };
  }

  const items: RawStudyKoreaItem[] = [];
  const seen = new Set<string>();

  for (const { query, display } of NEWS_QUERIES) {
    try {
      const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=date`;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) {
        console.warn(`[naver_news] ${query}: HTTP ${res.status}`);
        continue;
      }
      const json = (await res.json()) as { items?: NaverNewsItem[] };
      for (const item of json.items ?? []) {
        const url = normalizeNaverPostUrl(item.link);
        const source_id = naverPostSourceId(url, "news");
        if (!url || seen.has(source_id)) continue;
        seen.add(source_id);
        items.push({
          source_id,
          title: stripNaverHtml(item.title),
          content: stripNaverHtml(item.description),
          url,
          author: "naver_news",
          language: "ko",
          source_created_at: parsePubDate(item.pubDate),
        });
      }
      console.log(`[naver_news] ${query} → ${json.items?.length ?? 0}`);
    } catch (e) {
      console.warn(
        `[naver_news] query "${query}":`,
        e instanceof Error ? e.message : e
      );
    }
  }

  console.log(`[naver_news] total unique: ${items.length}`);
  return processAndSaveItems(
    "naver_news",
    "naver_news",
    items,
    NEWS_QUERIES.map((q) => q.query).join(" | ")
  );
}
