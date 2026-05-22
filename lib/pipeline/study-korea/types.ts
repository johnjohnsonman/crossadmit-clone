export type StudyKoreaCategory =
  | "admission"
  | "scholarship"
  | "visa"
  | "dormitory"
  | "life"
  | "language"
  | "cost"
  | "general";

export type StudyKoreaSource =
  | "reddit"
  | "youtube"
  | "quora"
  | "studyinkorea"
  | "university_official"
  | "naver_blog";

export interface StudyKoreaAnalysis {
  category: StudyKoreaCategory;
  university: string;
  ai_summary: string;
  ai_summary_kr: string;
  ai_tags: string[];
  is_relevant: boolean;
}

export interface StudyKoreaPostInput {
  source: StudyKoreaSource;
  source_id: string;
  title: string;
  content: string;
  url: string;
  author: string;
  upvotes: number;
  comment_count: number;
  source_created_at: string | null;
  language?: string;
  category?: StudyKoreaCategory;
  university?: string;
  ai_summary?: string;
  ai_summary_kr?: string;
  ai_tags?: string[];
  is_published?: boolean;
}

export interface ScrapeRunResult {
  collected: number;
  processed: number;
  saved: number;
  failed: number;
  skipped: number;
  errors: string[];
}
