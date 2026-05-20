import Anthropic from "@anthropic-ai/sdk";
import type {
  ProcessedAdmission,
  RedditPost,
  YouTubeVideo,
} from "../../scripts/sources/types";
import { videoUrl } from "../../scripts/sources/youtube-studyinkorea";

const MODEL = "claude-sonnet-4-20250514";
const MIN_RELEVANCE = 0.4;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set in environment");
  }
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You extract structured information from Reddit posts about foreigners studying in Korea.
Focus on study abroad experiences, admissions, visas, language (TOPIK), university life, and practical tips.
If the post is NOT relevant to studying in Korea as a foreigner, set relevance_score below 0.4.
Respond with valid JSON only, no markdown fences.`;

function buildUserPrompt(post: RedditPost, source: string): string {
  const body = [post.title, post.selftext].filter(Boolean).join("\n\n");
  return `Analyze this Reddit post from r/${post.subreddit}.

Source label for DB: "${source}"
Post URL: ${post.permalink}
Author: u/${post.author}

---
${body.slice(0, 12000)}
---

Return JSON matching this schema:
{
  "university": "Korean or English university name if mentioned, else null",
  "university_en": "English name if known, else null",
  "major": "field of study if mentioned, else null",
  "year": "admission or study year as number if mentioned, else null",
  "status": "e.g. admitted, enrolled, applying, graduated — or null",
  "nationality": "author nationality if inferable, else null",
  "topik_level": "TOPIK level 1-6 if mentioned, else null",
  "language_proficiency": "object with keys like english, korean, ielts, toefl if mentioned, else {}",
  "summary": "2-3 sentence summary in English",
  "pros": ["positive aspects mentioned"],
  "cons": ["challenges or negatives mentioned"],
  "tips": ["actionable advice for prospective students"],
  "original_language": "ISO 639-1 code of post language",
  "relevance_score": "0.0 to 1.0 — how relevant to foreign students studying in Korea"
}`;
}

interface ClaudeExtraction {
  university?: string | null;
  university_en?: string | null;
  major?: string | null;
  year?: number | null;
  status?: string | null;
  nationality?: string | null;
  topik_level?: number | null;
  language_proficiency?: Record<string, unknown>;
  summary?: string;
  pros?: string[];
  cons?: string[];
  tips?: string[];
  original_language?: string;
  relevance_score?: number;
}

/**
 * Reddit 포스트를 Claude로 분석해 ProcessedAdmission으로 변환합니다.
 * 관련성이 낮으면 null을 반환합니다.
 */
export async function analyzeRedditPost(
  post: RedditPost,
  source: string
): Promise<ProcessedAdmission | null> {
  const client = getClient();
  const rawContent = [post.title, post.selftext].filter(Boolean).join("\n\n");

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(post, source) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  let parsed: ClaudeExtraction;
  try {
    parsed = JSON.parse(textBlock.text) as ClaudeExtraction;
  } catch {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Claude JSON response");
    parsed = JSON.parse(jsonMatch[0]) as ClaudeExtraction;
  }

  const relevance = Math.min(1, Math.max(0, parsed.relevance_score ?? 0));
  if (relevance < MIN_RELEVANCE) {
    return null;
  }

  return {
    university: parsed.university ?? undefined,
    university_en: parsed.university_en ?? undefined,
    major: parsed.major ?? undefined,
    year: parsed.year ?? undefined,
    status: parsed.status ?? undefined,
    nationality: parsed.nationality ?? undefined,
    topik_level: parsed.topik_level ?? undefined,
    language_proficiency: parsed.language_proficiency ?? {},
    raw_content: rawContent,
    summary: parsed.summary ?? post.title,
    pros: parsed.pros ?? [],
    cons: parsed.cons ?? [],
    tips: parsed.tips ?? [],
    source,
    source_url: post.permalink,
    source_author: post.author,
    original_language: parsed.original_language ?? "en",
    relevance_score: relevance,
  };
}

const YOUTUBE_MIN_RELEVANCE = 0.5;

const YOUTUBE_SYSTEM_PROMPT = `You extract structured information from YouTube videos about foreigners studying in Korea.
Focus on university experiences, student life, TOPIK/Korean language, visas, and study abroad tips.
If the video is NOT relevant to studying in Korea as a foreigner, set relevance_score below 0.5.
Respond with valid JSON only, no markdown fences.`;

function buildYouTubePrompt(video: YouTubeVideo): string {
  const url = videoUrl(video.videoId);
  return `Analyze this YouTube video about studying in Korea.

URL: ${url}
Channel: ${video.channelTitle}
Published: ${video.publishedAt}
Views: ${video.viewCount}

Title: ${video.title}

Description:
${video.description}

Return JSON:
{
  "university": "Korean name if mentioned, else null",
  "university_en": "English university name if mentioned, else null",
  "major": "field of study if mentioned, else null",
  "year": "year as number if mentioned, else null",
  "nationality": "creator nationality if inferable, else null",
  "topik_level": "TOPIK level 1-6 if Korean level mentioned, else null",
  "language_proficiency": "object with language test scores if mentioned, else {}",
  "summary": "2-3 sentence summary in English",
  "pros": ["positive aspects"],
  "cons": ["challenges"],
  "tips": ["actionable study-in-Korea advice"],
  "original_language": "ISO 639-1 code of primary video language",
  "relevance_score": "0.0 to 1.0 relevance to foreign students studying in Korea"
}`;
}

/**
 * YouTube 영상(제목+설명)을 Claude로 분석합니다.
 * relevance_score < 0.5면 null 반환.
 */
export async function analyzeYouTubeVideo(
  video: YouTubeVideo
): Promise<ProcessedAdmission | null> {
  const client = getClient();
  const rawContent = `${video.title}\n\n${video.description}`;
  const url = videoUrl(video.videoId);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: YOUTUBE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildYouTubePrompt(video) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  let parsed: ClaudeExtraction;
  try {
    parsed = JSON.parse(textBlock.text) as ClaudeExtraction;
  } catch {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Claude JSON response");
    parsed = JSON.parse(jsonMatch[0]) as ClaudeExtraction;
  }

  const relevance = Math.min(1, Math.max(0, parsed.relevance_score ?? 0));
  if (relevance < YOUTUBE_MIN_RELEVANCE) {
    return null;
  }

  return {
    university: parsed.university ?? undefined,
    university_en: parsed.university_en ?? undefined,
    major: parsed.major ?? undefined,
    year: parsed.year ?? undefined,
    status: "경험공유",
    nationality: parsed.nationality ?? undefined,
    topik_level: parsed.topik_level ?? undefined,
    language_proficiency: parsed.language_proficiency ?? {},
    raw_content: rawContent,
    summary: parsed.summary ?? video.title,
    pros: parsed.pros ?? [],
    cons: parsed.cons ?? [],
    tips: parsed.tips ?? [],
    source: "youtube",
    source_url: url,
    source_author: video.channelTitle,
    original_language: parsed.original_language ?? "en",
    relevance_score: relevance,
  };
}
