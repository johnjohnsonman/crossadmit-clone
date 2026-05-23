import Parser from "rss-parser";
import { createAdminClient } from "@/lib/supabase/admin";

export const REDDIT_RSS_USER_AGENT =
  "CrossAdmit/1.0 (https://crossadmit.com)";

export const BETWEEN_RSS_REQUESTS_MS = 2000;
const MIN_BODY_CHARS = 250;

export type SubredditConfig = {
  name: string;
  priority: number;
  keyword_filter?: string[];
};

export const SUBREDDITS: SubredditConfig[] = [
  { name: "studyinkorea", priority: 1 },
  {
    name: "korea",
    priority: 2,
    keyword_filter: ["study", "university", "visa", "admission"],
  },
  { name: "Living_in_Korea", priority: 2 },
  { name: "KoreanAdvice", priority: 3 },
  { name: "teachinginkorea", priority: 3 },
];

export const RSS_FEEDS_PER_SUBREDDIT = [
  "/hot.rss",
  "/new.rss",
  "/top.rss?t=month",
] as const;

export type RedditRssItem = {
  id: string;
  title: string;
  content: string;
  link: string;
  author: string;
  pubDate: string | null;
  subreddit: string;
  categories: string[];
  feedLabel: string;
};

const parser = new Parser({
  headers: {
    "User-Agent": REDDIT_RSS_USER_AGENT,
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
    ],
  },
});

const MEGATHREAD_RE =
  /weekly\s+thread|megathread|daily\s+thread|question\s+thread|simple\s+questions/i;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** HTML 태그 제거 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 기본 HTML 엔티티 디코딩 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    );
}

export function cleanRssBody(raw: string): string {
  return decodeHtmlEntities(stripHtml(raw));
}

/** Reddit permalink에서 post ID 추출 */
export function extractRedditPostId(link: string, guid?: string): string {
  if (guid) {
    const t3 = guid.match(/t3_([a-z0-9]+)/i);
    if (t3?.[1]) return t3[1];
  }
  const m = link.match(/\/comments\/([a-z0-9]+)/i);
  if (m?.[1]) return m[1];
  try {
    const u = new URL(link);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("comments");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    /* ignore */
  }
  return link.slice(-12);
}

function itemRawContent(item: Parser.Item & { contentEncoded?: string }): string {
  const enc = item.contentEncoded ?? "";
  const content = item.content ?? item.contentSnippet ?? "";
  return enc || content || item.summary || "";
}

function matchesKeywordFilter(
  item: { title: string; content: string },
  keywords?: string[]
): boolean {
  if (!keywords?.length) return true;
  const text = `${item.title} ${item.content}`.toLowerCase();
  return keywords.some((k) => text.includes(k.toLowerCase()));
}

export function shouldSkipRssItem(
  title: string,
  content: string
): string | null {
  if (!title.trim()) return "empty title";
  if (MEGATHREAD_RE.test(title)) return "megathread";
  if (/\[?\s*(removed|deleted)\s*\]?/i.test(content)) return "removed";
  if (content.length < MIN_BODY_CHARS) return "short body";
  return null;
}

function parseItem(
  item: Parser.Item & { contentEncoded?: string; creator?: string },
  subreddit: string,
  feedLabel: string
): RedditRssItem | null {
  const title = (item.title ?? "").trim();
  const link = (item.link ?? item.guid ?? "").trim();
  if (!link) return null;

  const content = cleanRssBody(itemRawContent(item));
  const skip = shouldSkipRssItem(title, content);
  if (skip) return null;

  const id = extractRedditPostId(link, item.guid);
  const author =
    (item.creator as string | undefined)?.replace(/^\/u\//, "") ||
    (item.author as string | undefined)?.replace(/^\/u\//, "") ||
    "unknown";

  const categories = Array.isArray(item.categories)
    ? item.categories.map(String)
    : item.categories
      ? [String(item.categories)]
      : [];

  return {
    id,
    title,
    content,
    link: link.startsWith("http") ? link : `https://www.reddit.com${link}`,
    author,
    pubDate: item.pubDate ?? item.isoDate ?? null,
    subreddit,
    categories,
    feedLabel,
  };
}

export async function fetchSubredditRssFeed(
  subreddit: string,
  feedPath: string
): Promise<RedditRssItem[]> {
  const url = `https://www.reddit.com/r/${subreddit}${feedPath}`;
  const label = `r/${subreddit}${feedPath}`;

  try {
    const feed = await parser.parseURL(url);
    const items: RedditRssItem[] = [];
    for (const raw of feed.items ?? []) {
      const parsed = parseItem(
        raw as Parser.Item & { contentEncoded?: string; creator?: string },
        subreddit,
        label
      );
      if (parsed) items.push(parsed);
    }
    console.log(`[reddit-rss] ${label}: ${items.length} items`);
    return items;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[reddit-rss] skip ${label}:`, msg);
    return [];
  }
}

/** DB에 이미 있는 reddit source_id 집합 */
export async function loadExistingRedditSourceIds(): Promise<Set<string>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("study_korea_posts")
      .select("source_id")
      .eq("source", "reddit");

    if (error) {
      console.warn("[reddit-rss] existing ids load failed:", error.message);
      return new Set();
    }
    return new Set((data ?? []).map((r) => String(r.source_id)));
  } catch (e) {
    console.warn("[reddit-rss] existing ids load error:", e);
    return new Set();
  }
}

/**
 * 모든 서브레딧 × RSS 피드 수집 (중복·DB·키워드 필터 적용).
 */
export async function collectRedditRssPosts(): Promise<{
  items: RedditRssItem[];
  errors: string[];
  skippedExisting: number;
  skippedDuplicate: number;
  skippedFilter: number;
}> {
  const errors: string[] = [];
  const seenLinks = new Set<string>();
  const seenIds = new Set<string>();
  const existingIds = await loadExistingRedditSourceIds();
  const items: RedditRssItem[] = [];
  let skippedExisting = 0;
  let skippedDuplicate = 0;
  let skippedFilter = 0;

  const sorted = [...SUBREDDITS].sort((a, b) => a.priority - b.priority);

  for (const sub of sorted) {
    for (const feedPath of RSS_FEEDS_PER_SUBREDDIT) {
      const batch = await fetchSubredditRssFeed(sub.name, feedPath);
      await sleep(BETWEEN_RSS_REQUESTS_MS);

      for (const item of batch) {
        if (seenLinks.has(item.link) || seenIds.has(item.id)) {
          skippedDuplicate++;
          continue;
        }
        if (existingIds.has(item.id)) {
          skippedExisting++;
          continue;
        }
        if (
          sub.keyword_filter &&
          !matchesKeywordFilter(item, sub.keyword_filter)
        ) {
          skippedFilter++;
          continue;
        }

        seenLinks.add(item.link);
        seenIds.add(item.id);
        items.push(item);
      }
    }
  }

  console.log(
    `[reddit-rss] collected=${items.length} skip_db=${skippedExisting} skip_dup=${skippedDuplicate} skip_kw=${skippedFilter}`
  );

  return {
    items,
    errors,
    skippedExisting,
    skippedDuplicate,
    skippedFilter,
  };
}
