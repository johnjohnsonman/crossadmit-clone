import type { RedditPostData } from "./reddit-fetch";

const MEGATHREAD_RE =
  /weekly\s+thread|megathread|daily\s+thread|question\s+thread|simple\s+questions/i;

const DELETED_BODY =
  /^\[?(removed|deleted)\]?$/i;

/** 1차 필터 — AI 분류 전 (Reddit 수집 직후) */
export function passesRedditPrefilter(post: RedditPostData): string | null {
  const title = (post.title ?? "").trim();
  const selftext = (post.selftext ?? "").trim();
  const url = (post.url ?? "").trim();

  if (!title) return "empty title";
  if (MEGATHREAD_RE.test(title)) return "megathread";
  if (DELETED_BODY.test(selftext) || DELETED_BODY.test(title)) return "removed";

  if (!selftext) {
    const isExternal =
      url &&
      !url.includes("reddit.com") &&
      !url.includes("redd.it") &&
      !(post.permalink && url.includes(post.permalink));
    if (isExternal) return "link-only";
    return "empty body";
  }

  if (selftext.length < 200) return "short body";

  return null;
}
