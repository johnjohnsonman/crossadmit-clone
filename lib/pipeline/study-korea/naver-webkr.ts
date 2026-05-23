import { isNaverConfigured, naverHeaders, stripNaverHtml } from "./naver-api";

export interface NaverWebkrItem {
  title: string;
  link: string;
  description: string;
}

export async function searchNaverWebkr(
  query: string,
  display = 30
): Promise<NaverWebkrItem[]> {
  if (!isNaverConfigured()) {
    console.warn("[NAVER_WEBKR] NAVER_CLIENT_ID / NAVER_CLIENT_SECRET not set");
    return [];
  }

  const headers = naverHeaders();
  if (!headers) return [];

  const url = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=${display}&sort=date`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    console.error("[NAVER_WEBKR]", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as { items?: Array<Record<string, string>> };
  return (data.items ?? []).map((item) => ({
    title: stripNaverHtml(item.title ?? ""),
    link: item.link ?? "",
    description: stripNaverHtml(item.description ?? ""),
  }));
}
