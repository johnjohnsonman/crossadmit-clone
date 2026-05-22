import { processAndSaveItems, type RawStudyKoreaItem } from "./process-items";
import { slugId } from "./fetch-html";

const NAVER_QUERY = "한국유학+외국인";

function naverHeaders(): HeadersInit | null {
  const id = process.env.NAVER_CLIENT_ID?.trim();
  const secret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!id || !secret) return null;
  return {
    "X-Naver-Client-Id": id,
    "X-Naver-Client-Secret": secret,
  };
}

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

  const items: RawStudyKoreaItem[] = raw.map((item) => {
    const title = item.title.replace(/<[^>]+>/g, "");
    const description = item.description.replace(/<[^>]+>/g, "");
    const postdate = item.postdate;
    const iso = postdate?.length === 8
      ? `${postdate.slice(0, 4)}-${postdate.slice(4, 6)}-${postdate.slice(6, 8)}T00:00:00Z`
      : null;

    return {
      source_id: slugId(item.link),
      title,
      content: description,
      url: item.link,
      author: item.bloggername,
      language: "ko",
      source_created_at: iso,
    };
  });

  console.log(`[naver_blog] fetched ${items.length} posts`);
  return processAndSaveItems("naver_blog", "naver_blog", items, NAVER_QUERY);
}

export function isNaverConfigured(): boolean {
  return Boolean(
    process.env.NAVER_CLIENT_ID?.trim() &&
      process.env.NAVER_CLIENT_SECRET?.trim()
  );
}
