import { createHash } from "crypto";

/** Naver 블로그/뉴스 URL을 비교·저장용으로 통일 */
export function normalizeNaverPostUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const u = new URL(trimmed);
    if (u.protocol === "http:") u.protocol = "https:";

    const host = u.hostname.toLowerCase();

    // blog.naver.com/{blogId}/{logNo}
    if (host === "blog.naver.com" || host.endsWith(".blog.naver.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
        return `https://blog.naver.com/${parts[0]}/${parts[1]}`;
      }
      const blogId = u.searchParams.get("blogId");
      const logNo = u.searchParams.get("logNo");
      if (blogId && logNo) {
        return `https://blog.naver.com/${blogId}/${logNo}`;
      }
    }

    // n.news.naver.com / news.naver.com article oid/aid
    const article = u.pathname.match(/\/article\/(\d+)\/(\d+)/);
    if (article) {
      return `https://n.news.naver.com/mnews/article/${article[1]}/${article[2]}`;
    }

    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return trimmed;
  }
}

/** 동일 URL → 동일 source_id (UNIQUE(source, source_id) 충족) */
export function naverPostSourceId(
  rawUrl: string,
  kind: "blog" | "news"
): string {
  const url = normalizeNaverPostUrl(rawUrl);
  if (!url) return `${kind}-empty`;

  const blog = url.match(/blog\.naver\.com\/([^/]+)\/(\d+)/i);
  if (blog) return `${kind}-${blog[1]}-${blog[2]}`;

  const news = url.match(/article\/(\d+)\/(\d+)/);
  if (news) return `${kind}-article-${news[1]}-${news[2]}`;

  const hash = createHash("sha256").update(url).digest("hex").slice(0, 24);
  return `${kind}-url-${hash}`;
}
