export type StudyKoreaCategory =
  | "admission"
  | "scholarship"
  | "visa"
  | "dormitory"
  | "living_cost"
  | "language"
  | "campus_life"
  | "settlement"
  | "employment"
  | "culture"
  | "general"
  /** @deprecated use living_cost | culture */
  | "life"
  /** @deprecated use living_cost */
  | "cost";

/** 텍스트 콘텐츠 소스 (YouTube는 university_videos 전용) */
export type StudyKoreaSource =
  | "reddit"
  | "quora"
  | "studyinkorea"
  | "university_official"
  | "naver_blog"
  | "naver_news";

export type StudyKoreaSubcategory =
  | "admission"
  | "scholarship"
  | "visa"
  | "dormitory"
  | "life"
  | "language"
  | "general";

export interface StudyKoreaAnalysis {
  category: StudyKoreaCategory;
  university: string;
  ai_summary: string;
  ai_summary_kr: string;
  ai_title_en: string;
  ai_summary_en: string;
  ai_content_en: string;
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
  subcategory?: StudyKoreaSubcategory;
  university?: string;
  university_id?: number | null;
  ai_summary?: string;
  ai_summary_kr?: string;
  ai_title_en?: string;
  ai_summary_en?: string;
  ai_content_en?: string;
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
