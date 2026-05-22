import { processAndSaveItems, type RawStudyKoreaItem } from "./process-items";
import { naverPostSourceId, normalizeNaverPostUrl } from "./naver-url";
import { isNaverConfigured, naverHeaders, stripNaverHtml } from "./naver-api";

const NAVER_QUERY = "한국유학+외국인";

interface NaverBlogItem {
  title: string;
  description: string;
  bloggername: string;
  postdate: string;
  link: string;
}

export async function scrapeNaverStudyKorea() {
  const headers = naverHeaders();
  if (!headers) {
    console.log("[naver_blog] skipped — NAVER_CLIENT_ID/SECRET not set");
    return {
      collected: 0,
      processed: 0,
      saved: 0,
      failed: 0,
      skipped: 0,
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
  const items: RawStudyKoreaItem[] = [];

  for (const item of raw) {
    const url = normalizeNaverPostUrl(item.link);
    const source_id = naverPostSourceId(url, "blog");
    if (!url || seen.has(source_id)) continue;
    seen.add(source_id);

    const title = stripNaverHtml(item.title);
    const description = stripNaverHtml(item.description);
    const postdate = item.postdate;
    const iso =
      postdate?.length === 8
        ? `${postdate.slice(0, 4)}-${postdate.slice(4, 6)}-${postdate.slice(6, 8)}T00:00:00Z`
        : null;

    items.push({
      source_id,
      title,
      content: description,
      url,
      author: item.bloggername,
      language: "ko",
      source_created_at: iso,
    });
  }

  console.log(`[naver_blog] fetched ${raw.length} → unique ${items.length} posts`);
  return processAndSaveItems("naver_blog", "naver_blog", items, NAVER_QUERY);
}

export { isNaverConfigured } from "./naver-api";
