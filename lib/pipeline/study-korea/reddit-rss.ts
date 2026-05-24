import Parser from "rss-parser";
import { createAdminClient } from "@/lib/supabase/admin";

export const REDDIT_RSS_USER_AGENT =
  "CrossAdmit/1.0 (https://crossadmit.com)";

export const BETWEEN_RSS_REQUESTS_MS = 2000;
const MIN_BODY_CHARS = 250;
const RSS_FETCH_TIMEOUT_MS = 10_000;
const RSS_MAX_BYTES = 100 * 1024;

export type SubredditConfig = {
  name: string;
  priority: number;
  keyword_filter?: string[];
};

/** 합격 후기 발견 가능성 높음 */
export const ADMISSION_FOCUSED_SUBREDDITS = [
  "StudyInKorea",
  "koreanstudents",
  "IntltoKorea",
] as const;

/** 일반 유학·생활 정보 (가끔 합격기 포함) */
export const GENERAL_INFO_SUBREDDITS = [
  "Korea",
  "learnkorean",
  "movingtokorea",
] as const;

export const SUBREDDITS: SubredditConfig[] = [
  ...ADMISSION_FOCUSED_SUBREDDITS.map((name, i) => ({
    name,
    priority: 1 + i,
  })),
  ...GENERAL_INFO_SUBREDDITS.map((name, i) => ({
    name,
    priority: 10 + i,
    keyword_filter:
      name === "Korea"
        ? ["university", "admission", "accepted", "gks", "scholarship", "student", "study"]
        : ["university", "admission", "student", "visa", "korea"],
  })),
];

/** 기본은 hot만 (타임아웃 방지). new/top은 feed 파라미터로 */
export const RSS_FEED_PATHS: Record<string, string> = {
  hot: "/hot.rss",
  new: "/new.rss",
  top: "/top.rss?t=month",
};

export const DEFAULT_RSS_FEED = "hot";

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
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
    ],
  },
});

const MEGATHREAD_RE =
  /weekly\s+thread|megathread|daily\s+thread|question\s+thread|simple\s+questions/i;

function matchesKeywordFilter(
  item: { title: string; content: string },
  keywords?: string[]
): boolean {
  if (!keywords?.length) return true;
  const text = `${item.title} ${item.content}`.toLowerCase();
  return keywords.some((k) => text.includes(k.toLowerCase()));
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

export function resolveFeedPath(feed: string): string {
  const key = feed.toLowerCase();
  return RSS_FEED_PATHS[key] ?? RSS_FEED_PATHS[DEFAULT_RSS_FEED]!;
}

export function getSubredditNames(): string[] {
  return [...SUBREDDITS]
    .sort((a, b) => a.priority - b.priority)
    .map((s) => s.name);
}

export function getSubredditConfig(name: string): SubredditConfig | undefined {
  return SUBREDDITS.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
}

export function getRemainingSubreddits(current: string): string[] {
  const names = getSubredditNames();
  const idx = names.findIndex((n) => n.toLowerCase() === current.toLowerCase());
  if (idx < 0) return names.filter((n) => n.toLowerCase() !== current.toLowerCase());
  return names.slice(idx + 1);
}

async function fetchRssXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RSS_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": REDDIT_RSS_USER_AGENT,
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > RSS_MAX_BYTES ? buf.slice(0, RSS_MAX_BYTES) : buf;
    return new TextDecoder("utf-8", { fatal: false }).decode(slice);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSubredditRssFeed(
  subreddit: string,
  feedPath: string
): Promise<RedditRssItem[]> {
  const url = `https://www.reddit.com/r/${subreddit}${feedPath}`;
  const label = `r/${subreddit}${feedPath}`;

  try {
    const xml = await fetchRssXml(url);
    const feed = await parser.parseString(xml);
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

/** DB에 이미 있는 reddit source_id / URL 집합 */
export async function loadExistingRedditSourceIds(): Promise<Set<string>> {
  try {
    const supabase = createAdminClient();
    const [{ data: posts, error: postsErr }, { data: admissions, error: admErr }] =
      await Promise.all([
        supabase
          .from("study_korea_posts")
          .select("source_id, url")
          .eq("source", "reddit"),
        supabase
          .from("admissions")
          .select("source_url")
          .like("source_type", "scraped_reddit"),
      ]);

    if (postsErr) {
      console.warn("[reddit-rss] existing ids load failed:", postsErr.message);
    }
    if (admErr) {
      console.warn("[reddit-rss] admissions urls load failed:", admErr.message);
    }

    const out = new Set<string>();
    for (const r of posts ?? []) {
      if (r.source_id) out.add(String(r.source_id));
      if (r.url) out.add(String(r.url));
    }
    for (const a of admissions ?? []) {
      if (a.source_url) out.add(String(a.source_url));
    }
    return out;
  } catch (e) {
    console.warn("[reddit-rss] existing ids load error:", e);
    return new Set();
  }
}

/**
 * 단일 서브레딧 × 단일 RSS 피드 수집 (배치 API용).
 */
export async function collectRedditRssForSubreddit(
  subreddit: string,
  feed = DEFAULT_RSS_FEED
): Promise<{
  items: RedditRssItem[];
  feedPath: string;
  skippedExisting: number;
  skippedDuplicate: number;
  skippedFilter: number;
}> {
  const config = getSubredditConfig(subreddit);
  if (!config) {
    throw new Error(`Unknown subreddit: ${subreddit}`);
  }

  const feedPath = resolveFeedPath(feed);
  const existingIds = await loadExistingRedditSourceIds();
  const seenLinks = new Set<string>();
  const seenIds = new Set<string>();
  const items: RedditRssItem[] = [];
  let skippedExisting = 0;
  let skippedDuplicate = 0;
  let skippedFilter = 0;

  const batch = await fetchSubredditRssFeed(config.name, feedPath);

  for (const item of batch) {
    if (seenLinks.has(item.link) || seenIds.has(item.id)) {
      skippedDuplicate++;
      continue;
    }
    if (existingIds.has(item.id) || existingIds.has(item.link)) {
      skippedExisting++;
      continue;
    }
    if (
      config.keyword_filter &&
      !matchesKeywordFilter(item, config.keyword_filter)
    ) {
      skippedFilter++;
      continue;
    }

    seenLinks.add(item.link);
    seenIds.add(item.id);
    items.push(item);
  }

  console.log(
    `[reddit-rss] ${config.name}/${feed}: collected=${items.length} skip_db=${skippedExisting} skip_kw=${skippedFilter}`
  );

  return {
    items,
    feedPath,
    skippedExisting,
    skippedDuplicate,
    skippedFilter,
  };
}
