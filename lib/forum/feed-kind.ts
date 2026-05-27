/** Forum feed `kind` filters — shared by /api/forum and UI tabs */

export type ForumFeedKind = "discussions" | "guides" | "news";

export const FORUM_FEED_KINDS: ForumFeedKind[] = [
  "discussions",
  "guides",
  "news",
];

/** Sources treated as news / announcements (not community discussions) */
export const FORUM_NEWS_SOURCES = [
  "study_korea_news",
  "naver_news",
  "kaist_herald",
  "skku_foreign",
  "kangwon_foreign",
  "pusan_foreign",
  "ku_insights",
  "sogang_foreign",
  "ajou_foreign",
  "kwangwoon_foreign",
  "yonsei_uic",
] as const;

export type ForumNewsSource = (typeof FORUM_NEWS_SOURCES)[number];

/** PostgREST `.in()` / `.not().in()` list format: (a,b,c) */
export function forumNewsSourcesInList(): string {
  return `(${FORUM_NEWS_SOURCES.join(",")})`;
}

export function isForumNewsSource(source: string): boolean {
  return (FORUM_NEWS_SOURCES as readonly string[]).includes(source);
}
