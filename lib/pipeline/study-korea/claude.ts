import Anthropic from "@anthropic-ai/sdk";
import type { StudyKoreaAnalysis, StudyKoreaCategory } from "./types";
import { normalizeUniversitySlug } from "./university-map";
import { isStudyInKoreaSubreddit } from "./relevance";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are processing content about studying in Korea.
Analyze the post and return JSON only:
{
  "category": "admission|scholarship|visa|dormitory|life|language|cost|general",
  "university": "university name or empty string",
  "ai_summary": "2-3 sentence English summary focusing on key info for prospective students",
  "ai_summary_kr": "2-3문장 한국어 요약",
  "ai_tags": ["tag1", "tag2", "tag3"],
  "is_relevant": true
}
Rules:
- Default is_relevant to true. Only set is_relevant=false for obvious spam or posts with under 10 characters of substance.
- Posts from r/studyinkorea MUST have is_relevant=true (that subreddit is Korea study abroad only).
- If only a title is provided (no body), still summarize from the title and set is_relevant=true.
No markdown fences.`;

const VALID_CATEGORIES = new Set<StudyKoreaCategory>([
  "admission",
  "scholarship",
  "visa",
  "dormitory",
  "life",
  "language",
  "cost",
  "general",
]);

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function parseJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Failed to parse Claude JSON");
    return JSON.parse(m[0]) as Record<string, unknown>;
  }
}

function toAnalysis(
  parsed: Record<string, unknown>,
  bodyText: string,
  subreddit?: string
): StudyKoreaAnalysis {
  const cat = String(parsed.category ?? "general");
  const category = VALID_CATEGORIES.has(cat as StudyKoreaCategory)
    ? (cat as StudyKoreaCategory)
    : "general";

  const uniRaw = String(parsed.university ?? "");
  const university =
    normalizeUniversitySlug(uniRaw, bodyText) ||
    normalizeUniversitySlug("", bodyText);

  const tags = Array.isArray(parsed.ai_tags)
    ? parsed.ai_tags.map((t) => String(t)).filter(Boolean).slice(0, 8)
    : [];

  const claudeRelevant = parsed.is_relevant !== false;
  const is_relevant = isStudyInKoreaSubreddit(subreddit)
    ? true
    : claudeRelevant;

  return {
    category,
    university: university || uniRaw.slice(0, 80),
    ai_summary: String(parsed.ai_summary ?? "").trim(),
    ai_summary_kr: String(parsed.ai_summary_kr ?? "").trim(),
    ai_tags: tags,
    is_relevant,
  };
}

export async function analyzeStudyKoreaContent(
  title: string,
  content: string,
  meta?: {
    source?: string;
    url?: string;
    author?: string;
    subreddit?: string;
  }
): Promise<StudyKoreaAnalysis> {
  const client = getClient();
  const body = [title, content].filter(Boolean).join("\n\n").slice(0, 12000);

  const user = [
    meta?.subreddit ? `Subreddit: r/${meta.subreddit}` : "",
    meta?.source ? `Source: ${meta.source}` : "",
    meta?.url ? `URL: ${meta.url}` : "",
    meta?.author ? `Author: ${meta.author}` : "",
    meta?.subreddit?.toLowerCase() === "studyinkorea"
      ? "Note: r/studyinkorea post — set is_relevant=true."
      : "",
    "---",
    body || title,
  ]
    .filter(Boolean)
    .join("\n");

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text");
  }

  const analysis = toAnalysis(
    parseJson(textBlock.text),
    body || title,
    meta?.subreddit
  );

  console.log(
    `[Reddit] Claude ${meta?.subreddit ?? "?"} / "${title.slice(0, 40)}…" → relevant=${analysis.is_relevant} cat=${analysis.category}`
  );

  return analysis;
}
