import { isNaverConfigured, naverHeaders, stripNaverHtml } from "./naver-api";

export interface NaverWebkrItem {
  title: string;
  link: string;
  description: string;
}

export async function searchNaverWebkr(
  query: string,
  display = 30,
  start = 1,
  signal?: AbortSignal
): Promise<NaverWebkrItem[]> {
  if (!isNaverConfigured()) {
    console.warn("[NAVER_WEBKR] NAVER_CLIENT_ID / NAVER_CLIENT_SECRET not set");
    return [];
  }

  const headers = naverHeaders();
  if (!headers) return [];

  const startClamped = Math.max(1, Math.min(start, 1000));
  const url = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=${display}&start=${startClamped}&sort=date`;

  const res = await fetch(url, { headers, signal });

  if (!res.ok) {
    const body = await res.text();
    console.error("[NAVER_WEBKR]", res.status, body.slice(0, 200));
    if (res.status === 429) {
      console.error("[NAVER_WEBKR] Rate limited — wait before retry");
    }
    return [];
  }

  const data = (await res.json()) as { items?: Array<Record<string, string>> };
  return (data.items ?? []).map((item) => ({
    title: stripNaverHtml(item.title ?? ""),
    link: item.link ?? "",
    description: stripNaverHtml(item.description ?? ""),
  }));
}
