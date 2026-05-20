export interface RedditPost {
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
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
}

export interface ProcessedAdmission {
  university?: string;
  university_en?: string;
  major?: string;
  year?: number;
  status?: string;
  nationality?: string;
  topik_level?: number;
  language_proficiency?: Record<string, unknown>;
  raw_content: string;
  summary: string;
  pros: string[];
  cons: string[];
  tips: string[];
  source: string;
  source_url: string;
  source_author: string;
  original_language: string;
  relevance_score: number;
}
