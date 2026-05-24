/**
 * Naver Blog scraper — items routed via runRoutedBatch → routeScrapedPost().
 */
import { naverPostSourceId, normalizeNaverPostUrl } from "@/lib/pipeline/study-korea/naver-url";
import { isNaverConfigured, naverHeaders, stripNaverHtml } from "@/lib/pipeline/study-korea/naver-api";
import { runRoutedBatch } from "@/lib/scrapers/run-routed-batch";
import { EMPTY_SCRAPE_RESULT } from "@/lib/pipeline/study-korea/types";

const NAVER_QUERY = "한국유학+외국인";

interface NaverBlogItem {
  title: string;
  description: string;
  bloggername: string;
  postdate: string;
  link: string;
}

export async function scrapeNaverBlog() {
  const headers = naverHeaders();
  if (!headers) {
    console.log("[scraper:naver_blog] skipped — NAVER credentials not set");
    return {
      ...EMPTY_SCRAPE_RESULT,
      errors: ["NAVER credentials not configured"],
    };
  }

  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(NAVER_QUERY)}&display=20&sort=date`;
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Naver API ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { items?: NaverBlogItem[] };
  const raw = json.items ?? [];
  const seen = new Set<string>();
  const items = [];

  for (const item of raw) {
    const postUrl = normalizeNaverPostUrl(item.link);
    const source_id = naverPostSourceId(postUrl, "blog");
    if (!postUrl || seen.has(source_id)) continue;
    seen.add(source_id);

    const postdate = item.postdate;
    const iso =
      postdate?.length === 8
        ? `${postdate.slice(0, 4)}-${postdate.slice(4, 6)}-${postdate.slice(6, 8)}T00:00:00Z`
        : null;

    items.push({
      source_id,
      title: stripNaverHtml(item.title),
      content: stripNaverHtml(item.description),
      url: postUrl,
      author: item.bloggername,
      language: "ko",
      source_created_at: iso,
    });
  }

  console.log(`[scraper:naver_blog] fetched ${raw.length} → unique ${items.length}`);
  return runRoutedBatch("naver_blog", "naver_blog", items, NAVER_QUERY);
}

export { isNaverConfigured };
