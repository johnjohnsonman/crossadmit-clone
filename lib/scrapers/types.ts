/** Normalized scraped post for routing pipeline */

export type ScrapedPostSource =
  | "reddit"
  | "naver_blog"
  | "naver_news"
  | "naver_webkr"
  | "university_official"
  | "studyinkorea"
  | "youtube";

export type ScrapedPost = {
  source: ScrapedPostSource | string;
  source_id: string;
  title: string;
  body: string;
  url: string;
  author?: string;
  subreddit?: string;
  language?: string;
  source_created_at?: string | null;
  upvotes?: number;
  comment_count?: number;
  university_id?: number | null;
  /** Skip study-korea Claude when true (e.g. official pages already structured) */
  skipStudyKoreaClaude?: boolean;
};

export type RouteResult =
  | {
      routed: "admission" | "review_needed";
      admissionId: number;
      classification: "admission" | "review_needed";
      confidence: number;
    }
  | {
      routed: "general" | "duplicate";
      reason: string;
    };
