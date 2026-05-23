import Anthropic from "@anthropic-ai/sdk";
import type { StudyKoreaAnalysis, StudyKoreaCategory } from "./types";
import { normalizeStudyKoreaCategory } from "./categories";
import { normalizeUniversitySlug } from "./university-map";

const MODEL = "claude-haiku-4-5-20251001";

export const FOREIGN_STUDENT_CLASSIFICATION_RULES = `
You classify content for international students who want to study IN Korea (not Koreans studying abroad).

Set is_relevant=true ONLY when the post gives actionable value in ONE of these categories:
1. visa — D-2, D-4, F-1, stay/extension, immigration for international students
2. admission — international admissions, application documents, acceptance stories
3. scholarship — GKS, university scholarships for foreigners, government support
4. dormitory — dorms, on-campus housing for international students
5. living_cost — tuition, living expenses, food, transport from a foreign student's budget view
6. language — TOPIK, Korean classes, language institutes, language exchange
7. campus_life — clubs, facilities, campus life for international students
8. settlement — ARC registration, insurance, bank, phone, transit card in Korea
9. employment — part-time work rules, post-graduation E-7 etc. for international students
10. culture — cultural adaptation tips for foreigners studying in Korea

Set is_relevant=false (exclude):
- General Korean politics/society news with no direct impact on international students
- Domestic tourism/industry PR (PATA, travel fairs, "감사의 정원") without student application steps
- Study abroad to OTHER countries (US, Japan, Europe)
- Info for general foreign residents (not students)
- Koreans going abroad (reverse direction)
- Ceremonies/awards/press releases without how international students can apply or benefit

Strict rules:
- Keywords like "foreign student" or "international" alone are NOT enough.
- Event coverage ("foreign student festival held") without application/how-to → false.
- When unsure, choose false. Prefer filtering out low-value content.
`;

const SYSTEM_PROMPT = `You analyze posts for a "Study in Korea" resource aimed at international students.
Return JSON only:
{
  "category": "visa|admission|scholarship|dormitory|living_cost|language|campus_life|settlement|employment|culture|general",
  "university": "university name or empty string",
  "ai_summary": "2-3 sentence English summary for international students",
  "ai_summary_kr": "2-3문장 한국어 요약 (외국인 유학생 관점)",
  "ai_title_en": "concise natural English title",
  "ai_summary_en": "3-4 sentences in English for international students",
  "ai_content_en": "full English body translation if under 500 words, else empty string",
  "ai_tags": ["tag1", "tag2"],
  "is_relevant": true
}
${FOREIGN_STUDENT_CLASSIFICATION_RULES}
Additional rules:
- is_relevant=false for spam or under 10 characters of substance.
- For ai_content_en: empty string if body missing or over ~500 words.
- category=general only if relevant but no better fit (rare).
If in doubt, is_relevant=false.
No markdown fences.`;

const RECLASSIFY_PROMPT = `Re-evaluate an existing post for international students studying in Korea.
Return JSON only:
{
  "category": "visa|admission|scholarship|dormitory|living_cost|language|campus_life|settlement|employment|culture|general",
  "is_relevant": true,
  "reason": "one short sentence in English"
}
${FOREIGN_STUDENT_CLASSIFICATION_RULES}
If in doubt, is_relevant=false.
No markdown fences.`;

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
  bodyText: string
): StudyKoreaAnalysis {
  const category = normalizeStudyKoreaCategory(
    String(parsed.category ?? "general")
  );

  const uniRaw = String(parsed.university ?? "");
  const university =
    normalizeUniversitySlug(uniRaw, bodyText) ||
    normalizeUniversitySlug("", bodyText);

  const tags = Array.isArray(parsed.ai_tags)
    ? parsed.ai_tags.map((t) => String(t)).filter(Boolean).slice(0, 8)
    : [];

  const is_relevant =
    parsed.is_relevant !== false && parsed.is_relevant !== "false";

  return {
    category,
    university: university || uniRaw.slice(0, 80),
    ai_summary: String(parsed.ai_summary ?? "").trim(),
    ai_summary_kr: String(parsed.ai_summary_kr ?? "").trim(),
    ai_title_en: String(parsed.ai_title_en ?? "").trim(),
    ai_summary_en: String(parsed.ai_summary_en ?? "").trim(),
    ai_content_en: String(parsed.ai_content_en ?? "").trim(),
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
    language?: string;
  }
): Promise<StudyKoreaAnalysis> {
  const client = getClient();
  const body = [title, content].filter(Boolean).join("\n\n").slice(0, 12000);
  const isEnglishReddit =
    meta?.source === "reddit" || meta?.language === "en";

  const user = [
    meta?.source ? `Source: ${meta.source}` : "",
    meta?.url ? `URL: ${meta.url}` : "",
    meta?.author ? `Author: ${meta.author}` : "",
    meta?.subreddit ? `Subreddit: r/${meta.subreddit}` : "",
    isEnglishReddit
      ? "Language: English (original). ai_summary in English; ai_summary_kr as Korean translation; ai_title_en same as title."
      : "",
    "---",
    body || title,
  ]
    .filter(Boolean)
    .join("\n");

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text");
  }

  const analysis = toAnalysis(parseJson(textBlock.text), body || title);

  console.log(
    `[study-korea] Claude ${meta?.subreddit ?? meta?.source ?? "?"} / "${title.slice(0, 40)}…" → relevant=${analysis.is_relevant} cat=${analysis.category}`
  );

  return analysis;
}

export type ReclassifyResult = {
  category: StudyKoreaCategory;
  is_relevant: boolean;
  reason: string;
};

export async function reclassifyStudyKoreaPost(
  title: string,
  content: string,
  aiSummary: string
): Promise<ReclassifyResult> {
  const client = getClient();
  const user = [
    `Title: ${title}`,
    `Summary: ${aiSummary}`,
    `Content: ${(content ?? "").slice(0, 4000)}`,
  ].join("\n");

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: RECLASSIFY_PROMPT,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text");
  }

  const parsed = parseJson(textBlock.text);
  const category = normalizeStudyKoreaCategory(String(parsed.category ?? "general"));
  const is_relevant =
    parsed.is_relevant !== false && parsed.is_relevant !== "false";

  return {
    category,
    is_relevant,
    reason: String(parsed.reason ?? "").trim().slice(0, 300),
  };
}

export type EnglishTranslation = {
  ai_title_en: string;
  ai_summary_en: string;
  ai_content_en: string;
};

export async function translateStudyKoreaContent(
  title: string,
  aiSummary: string,
  content: string
): Promise<EnglishTranslation> {
  const client = getClient();
  const userPrompt = `Translate the following Korean content to natural English.
Respond ONLY with valid JSON in this exact format:
{
  "ai_title_en": "English title",
  "ai_summary_en": "English summary (3-4 sentences)",
  "ai_content_en": "English content (full translation, max 500 words)"
}

Korean content:
Title: ${title}
Summary: ${aiSummary}
Content: ${(content ?? "").substring(0, 2000)}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text");
  }

  const parsed = parseJson(textBlock.text);
  return {
    ai_title_en: String(parsed.ai_title_en ?? "").trim().slice(0, 500),
    ai_summary_en: String(parsed.ai_summary_en ?? "").trim().slice(0, 2000),
    ai_content_en: String(parsed.ai_content_en ?? "").trim().slice(0, 8000),
  };
}
