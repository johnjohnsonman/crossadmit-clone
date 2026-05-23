/**
 * Reddit fetch: www JSON → old.reddit → RSS fallback.
 * Honest User-Agent; 2s delay between requests (rate limit).
 */

export const REDDIT_USER_AGENT =
  "CrossAdmit/1.0 (Korean Study Info Platform; +https://crossadmit.com)";

const TEST_USER_AGENT =
  "CrossAdmit/1.0 (Study Korea Info Platform; +https://crossadmit.com)";

const RATE_LIMIT_WAIT_MS = 2000;
export const BETWEEN_REQUESTS_MS = 2000;

let preferredMethod: "www" | "old" | "rss" | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function toOldRedditUrl(url: string): string {
  return url.replace("://www.reddit.com", "://old.reddit.com");
}

function toRssUrl(url: string): string {
  return url.replace(/\.json(\?|$)/, ".rss$1");
}

function buildHeaders(
  userAgent: string,
  accept = "application/json"
): HeadersInit {
  return {
    "User-Agent": userAgent,
    Accept: accept,
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.reddit.com/",
    "Cache-Control": "no-cache",
  };
}

export interface RedditListingChild<T = RedditPostData> {
  data: T;
}

export interface RedditPostData {
  id: string;
  title: string;
  selftext: string;
  url: string;
  author: string;
  subreddit?: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  link_flair_text?: string;
  is_self?: boolean;
}

export type FetchRedditResult<T> =
  | { ok: true; children: RedditListingChild<T>[]; method: "www" | "old" | "rss" }
  | { ok: false; error: string; status?: number };

export type RedditTestMethodResult = {
  status: number | null;
  item_count: number;
  sample_title: string | null;
  error: string | null;
};

function extractXmlTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m?.[1]) return "";
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function parseRedditRss(xml: string): RedditListingChild<RedditPostData>[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];
  const children: RedditListingChild<RedditPostData>[] = [];

  for (const entry of entries) {
    const title = extractXmlTag(entry, "title");
    const link =
      entry.match(/<link[^>]+href="([^"]+)"/i)?.[1] ??
      extractXmlTag(entry, "link");
    const content = extractXmlTag(entry, "content") || extractXmlTag(entry, "summary");
    const authorRaw = extractXmlTag(entry, "name") || extractXmlTag(entry, "author");
    const author = authorRaw.replace(/^\/u\//, "").trim() || "unknown";
    const idRaw = extractXmlTag(entry, "id");
    const id =
      idRaw.split("/").pop()?.replace(/^t3_/, "") ??
      link.match(/comments\/([a-z0-9]+)/i)?.[1] ??
      `rss_${children.length}`;

    const permalink = link.includes("reddit.com")
      ? new URL(link).pathname
      : `/r/studyinkorea/comments/${id}/`;

    children.push({
      data: {
        id,
        title,
        selftext: content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        url: link,
        author,
        subreddit: permalink.match(/\/r\/([^/]+)/)?.[1] ?? "studyinkorea",
        score: 0,
        num_comments: 0,
        created_utc: Math.floor(Date.now() / 1000),
        permalink,
        is_self: true,
      },
    });
  }

  return children;
}

async function fetchOnce(
  url: string,
  headers: HeadersInit
): Promise<{ status: number; text: string }> {
  const res = await fetch(url, { headers, cache: "no-store" });
  const text = await res.text();
  return { status: res.status, text };
}

async function fetchWwwJson<T = RedditPostData>(
  url: string,
  ua: string
): Promise<FetchRedditResult<T>> {
  try {
    const { status, text } = await fetchOnce(url, buildHeaders(ua));
    if (status === 429) {
      await sleep(RATE_LIMIT_WAIT_MS);
      const retry = await fetchOnce(url, buildHeaders(ua));
      if (retry.status === 429) {
        return { ok: false, error: "429 rate limit", status: 429 };
      }
      if (!retry.status || retry.status >= 400) {
        return {
          ok: false,
          error: `HTTP ${retry.status}`,
          status: retry.status,
        };
      }
      const json = JSON.parse(retry.text) as {
        data?: { children?: RedditListingChild<T>[] };
      };
      return { ok: true, children: json.data?.children ?? [], method: "www" };
    }
    if (status === 403) {
      return { ok: false, error: "403 Forbidden", status: 403 };
    }
    if (status < 200 || status >= 300) {
      return { ok: false, error: `HTTP ${status}`, status };
    }
    const json = JSON.parse(text) as {
      data?: { children?: RedditListingChild<T>[] };
    };
    return { ok: true, children: json.data?.children ?? [], method: "www" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function fetchOldJson<T = RedditPostData>(
  url: string
): Promise<FetchRedditResult<T>> {
  return fetchWwwJson<T>(toOldRedditUrl(url), REDDIT_USER_AGENT);
}

async function fetchRss<T = RedditPostData>(
  url: string
): Promise<FetchRedditResult<T>> {
  const rssUrl = toRssUrl(url);
  try {
    const { status, text } = await fetchOnce(
      rssUrl,
      buildHeaders(REDDIT_USER_AGENT, "application/rss+xml, application/xml, text/xml, */*")
    );
    if (status === 403 || status === 429) {
      return { ok: false, error: `HTTP ${status}`, status };
    }
    if (status < 200 || status >= 300) {
      return { ok: false, error: `HTTP ${status}`, status };
    }
    const children = parseRedditRss(text) as RedditListingChild<T>[];
    if (!children.length) {
      return { ok: false, error: "RSS parse: no entries" };
    }
    return { ok: true, children, method: "rss" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Admin 진단: 방식 A/B/C 각각 시도 */
export async function testRedditAccessMethods(): Promise<{
  method_a: RedditTestMethodResult;
  method_b: RedditTestMethodResult;
  method_c: RedditTestMethodResult;
  vercel_region: string | null;
}> {
  const testUrl =
    "https://www.reddit.com/r/studyinkorea/hot.json?limit=5";

  async function runA(): Promise<RedditTestMethodResult> {
    try {
      const res = await fetch(testUrl, {
        headers: { "User-Agent": TEST_USER_AGENT },
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          status: res.status,
          item_count: 0,
          sample_title: null,
          error: `HTTP ${res.status}`,
        };
      }
      const json = (await res.json()) as {
        data?: { children?: { data?: { title?: string } }[] };
      };
      const children = json.data?.children ?? [];
      return {
        status: res.status,
        item_count: children.length,
        sample_title: children[0]?.data?.title ?? null,
        error: null,
      };
    } catch (e) {
      return {
        status: null,
        item_count: 0,
        sample_title: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async function runB(): Promise<RedditTestMethodResult> {
    try {
      const res = await fetch(toOldRedditUrl(testUrl), {
        headers: buildHeaders(REDDIT_USER_AGENT),
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          status: res.status,
          item_count: 0,
          sample_title: null,
          error: `HTTP ${res.status}`,
        };
      }
      const json = (await res.json()) as {
        data?: { children?: { data?: { title?: string } }[] };
      };
      const children = json.data?.children ?? [];
      return {
        status: res.status,
        item_count: children.length,
        sample_title: children[0]?.data?.title ?? null,
        error: null,
      };
    } catch (e) {
      return {
        status: null,
        item_count: 0,
        sample_title: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async function runC(): Promise<RedditTestMethodResult> {
    try {
      const rssUrl =
        "https://www.reddit.com/r/studyinkorea/hot.rss?limit=5";
      const res = await fetch(rssUrl, {
        headers: buildHeaders(
          REDDIT_USER_AGENT,
          "application/rss+xml, application/xml, text/xml, */*"
        ),
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          status: res.status,
          item_count: 0,
          sample_title: null,
          error: `HTTP ${res.status}`,
        };
      }
      const text = await res.text();
      const children = parseRedditRss(text);
      return {
        status: res.status,
        item_count: children.length,
        sample_title: children[0]?.data?.title ?? null,
        error: null,
      };
    } catch (e) {
      return {
        status: null,
        item_count: 0,
        sample_title: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  const [method_a, method_b, method_c] = await Promise.all([
    runA(),
    runB(),
    runC(),
  ]);

  return {
    method_a,
    method_b,
    method_c,
    vercel_region: process.env.VERCEL_REGION ?? null,
  };
}

/**
 * Listing fetch with fallback chain (remembers last success for the run).
 */
export async function fetchRedditListing<T = RedditPostData>(
  url: string
): Promise<FetchRedditResult<T>> {
  const order: Array<"www" | "old" | "rss"> = preferredMethod
    ? [
        preferredMethod,
        ...(["www", "old", "rss"] as const).filter((m) => m !== preferredMethod),
      ]
    : ["www", "old", "rss"];

  let lastError = "Unknown error";
  let lastStatus: number | undefined;

  for (const method of order) {
    let result: FetchRedditResult<T>;
    if (method === "www") {
      result = await fetchWwwJson<T>(url, REDDIT_USER_AGENT);
    } else if (method === "old") {
      result = await fetchOldJson<T>(url);
    } else {
      result = await fetchRss<T>(url);
    }

    if (result.ok) {
      preferredMethod = result.method;
      return result;
    }

    lastError = result.error;
    lastStatus = result.status;
    if (result.status === 403 || result.status === 429) continue;
  }

  return { ok: false, error: lastError, status: lastStatus };
}

export async function fetchRedditFeed<T = RedditPostData>(
  url: string,
  label: string
): Promise<RedditListingChild<T>[]> {
  const result = await fetchRedditListing<T>(url);
  if (!result.ok) {
    console.warn(
      `[reddit-fetch] skip ${label}: ${result.error} (status ${result.status ?? "?"})`
    );
    return [];
  }
  console.log(
    `[reddit-fetch] ${label}: ${result.children.length} posts via ${result.method}`
  );
  await sleep(BETWEEN_REQUESTS_MS);
  return result.children;
}

/** 새 scrape 실행 시 fetch 방식 캐시 초기화 */
export function resetRedditFetchPreference(): void {
  preferredMethod = null;
}
