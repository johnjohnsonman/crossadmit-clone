import type { StudyKoreaPostRow } from "./queries";
import { normalizePostCategory, postPath } from "./reddit-categories";

export function postScore(post: {
  upvotes_count?: number | null;
  upvotes?: number | null;
  downvotes_count?: number | null;
}): number {
  const up = post.upvotes_count ?? post.upvotes ?? 0;
  const down = post.downvotes_count ?? 0;
  return Math.max(0, up - down);
}

export function postCommentsCount(post: {
  comments_count?: number | null;
  comment_count?: number | null;
}): number {
  return post.comments_count ?? post.comment_count ?? 0;
}

export function postHref(post: StudyKoreaPostRow): string {
  const cat = normalizePostCategory(post.category, post.subcategory);
  if (post.slug) return postPath(cat, post.slug);
  return post.url || "/forum";
}

export function formatTimeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export function sourceSubredditLabel(source: string): string {
  const map: Record<string, string> = {
    reddit: "studyinkorea",
    naver_blog: "naver",
    naver_news: "navernews",
    quora: "quora",
    studyinkorea: "studyinkorea",
    university_official: "university",
  };
  return map[source] ?? source;
}
