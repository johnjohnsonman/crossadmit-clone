import type { RedditPost } from "./types";

export const REDDIT_USER_AGENT =
  "crossadmit-clone/1.0 (Korea study abroad content aggregator; contact: dev@crossadmit.local)";

const MAX_LIMIT = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

export interface FetchSubredditOptions {
  sort?: "new" | "hot" | "top";
  limit?: number;
}

interface RedditListingChild {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    author: string;
    subreddit: string;
    created_utc: number;
    score: number;
    num_comments: number;
    permalink: string;
  };
}

interface RedditListingResponse {
  data?: {
    children?: RedditListingChild[];
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseListing(json: RedditListingResponse): RedditPost[] {
  const children = json.data?.children ?? [];
  return children.map(({ data }) => ({
    id: data.id,
    title: data.title,
    selftext: data.selftext ?? "",
    url: data.url,
    author: data.author,
    subreddit: data.subreddit,
    created_utc: data.created_utc,
    score: data.score,
    num_comments: data.num_comments,
    permalink: `https://www.reddit.com${data.permalink}`,
  }));
}

/**
 * Reddit 공개 JSON API에서 서브레딧 포스트를 가져옵니다.
 * @param subreddit 서브레딧 이름 (예: studyinkorea)
 * @param options sort(기본 new), limit(기본 100, 최대 100)
 */
export async function fetchSubredditPosts(
  subreddit: string,
  options: FetchSubredditOptions = {}
): Promise<RedditPost[]> {
  const sort = options.sort ?? "new";
  const limit = Math.min(options.limit ?? MAX_LIMIT, MAX_LIMIT);
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": REDDIT_USER_AGENT,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Reddit API ${response.status} ${response.statusText} for r/${subreddit}`
        );
      }

      const json = (await response.json()) as RedditListingResponse;
      return parseListing(json);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        console.warn(
          `[reddit] r/${subreddit} fetch failed (attempt ${attempt}/${MAX_RETRIES}): ${lastError.message}`
        );
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch r/${subreddit}`);
}
