/**
 * Reddit JSON fetch (Furniblog-style browser headers + UA rotation).
 * Used by study-korea pipeline to avoid 403 from bot-like clients.
 */

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "crossadmit-clone/1.0 (Korea study guide aggregator; +https://crossadmit.com)",
];

const RATE_LIMIT_WAIT_MS = 2000;
const BETWEEN_FEEDS_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function toOldRedditUrl(url: string): string {
  return url.replace("://www.reddit.com", "://old.reddit.com");
}

function buildHeaders(userAgent: string): HeadersInit {
  return {
    "User-Agent": userAgent,
    Accept: "application/json",
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
}

export type FetchRedditResult<T> =
  | { ok: true; children: RedditListingChild<T>[] }
  | { ok: false; error: string; status?: number };

/**
 * Fetch a Reddit .json listing with UA rotation, old.reddit fallback, rate-limit retry.
 */
export async function fetchRedditListing<T = RedditPostData>(
  url: string
): Promise<FetchRedditResult<T>> {
  const urlsToTry = [url, toOldRedditUrl(url)];
  let lastError = "Unknown error";
  let lastStatus: number | undefined;

  for (const tryUrl of urlsToTry) {
    for (let uaIndex = 0; uaIndex < USER_AGENTS.length; uaIndex++) {
      const ua = USER_AGENTS[uaIndex];

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(tryUrl, {
            headers: buildHeaders(ua),
            cache: "no-store",
          });

          if (res.status === 429) {
            console.warn(`[reddit] 429 rate limit, waiting ${RATE_LIMIT_WAIT_MS}ms…`);
            await sleep(RATE_LIMIT_WAIT_MS);
            continue;
          }

          if (res.status === 403) {
            lastStatus = 403;
            lastError = `403 Forbidden (${tryUrl})`;
            console.warn(
              `[reddit] 403 with UA #${uaIndex + 1}, ${uaIndex < USER_AGENTS.length - 1 ? "next UA" : "next URL"}…`
            );
            break;
          }

          if (!res.ok) {
            lastStatus = res.status;
            lastError = `HTTP ${res.status} ${res.statusText}`;
            break;
          }

          const json = (await res.json()) as {
            data?: { children?: RedditListingChild<T>[] };
          };
          return { ok: true, children: json.data?.children ?? [] };
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
        }
      }
    }
  }

  return { ok: false, error: lastError, status: lastStatus };
}

export async function fetchRedditFeed<T = RedditPostData>(
  url: string,
  label: string
): Promise<RedditListingChild<T>[]> {
  const result = await fetchRedditListing<T>(url);
  if (!result.ok) {
    console.warn(`[reddit] skip ${label}: ${result.error}`);
    return [];
  }
  await sleep(BETWEEN_FEEDS_MS);
  return result.children;
}
