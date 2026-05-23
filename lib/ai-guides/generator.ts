import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

export type AIGuideTopicInput = {
  topic_title: string;
  category: string;
  keywords: string[];
  reference_urls?: string[];
};

export type AIGuideContent = {
  title_en: string;
  title_ko: string;
  content_en: string;
  content_ko: string;
  summary_en: string;
  summary_ko: string;
  sources: string[];
};

const SYSTEM_PROMPT = `You are creating an educational guide for international students considering studying in Korea.

CRITICAL RULES:
1. Only provide factual, verifiable information
2. DO NOT pretend to be a real student
3. DO NOT make up personal experiences or anecdotes ("When I was a student...")
4. Cite official sources where possible (immigration.go.kr, studyinkorea.go.kr, university .ac.kr sites)
5. Use clear, helpful language
6. Structure with Markdown headings and bullet points
7. Include practical tips backed by official policy only
8. End content with a line: "**Disclaimer:** Always verify with official sources before applying or traveling."

Format: Markdown
Length: 800-1500 words per language version`;

function parseGuideJson(text: string): AIGuideContent {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return normalizeGuide(parsed);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Failed to parse AI guide JSON");
    return normalizeGuide(JSON.parse(m[0]) as Record<string, unknown>);
  }
}

function normalizeGuide(parsed: Record<string, unknown>): AIGuideContent {
  const sources = Array.isArray(parsed.sources)
    ? parsed.sources.map((s) => String(s)).filter(Boolean)
    : [];

  return {
    title_en: String(parsed.title_en ?? "").trim(),
    title_ko: String(parsed.title_ko ?? "").trim(),
    content_en: String(parsed.content_en ?? "").trim(),
    content_ko: String(parsed.content_ko ?? "").trim(),
    summary_en: String(parsed.summary_en ?? "").trim().slice(0, 300),
    summary_ko: String(parsed.summary_ko ?? "").trim().slice(0, 300),
    sources,
  };
}

export async function generateAIGuide(
  topic: AIGuideTopicInput
): Promise<AIGuideContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const refs =
    topic.reference_urls?.length ?
      `\nReference URLs to consider: ${topic.reference_urls.join(", ")}`
    : "";

  const userPrompt = `Create a comprehensive factual guide on:
"${topic.topic_title}"

Category: ${topic.category}
Target SEO keywords: ${topic.keywords.join(", ")}${refs}

Provide:
1. English version (full guide, markdown)
2. Korean version (full translation, markdown)
3. Short summaries in both languages (~150 characters each)
4. List of official source URLs used (immigration, studyinkorea, universities, etc.)

Respond with JSON only (no markdown fences):
{
  "title_en": "...",
  "title_ko": "...",
  "content_en": "markdown content",
  "content_ko": "markdown content",
  "summary_en": "...",
  "summary_ko": "...",
  "sources": ["https://...", "https://..."]
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text for AI guide");
  }

  const guide = parseGuideJson(block.text);
  if (!guide.title_en || !guide.content_en) {
    throw new Error("AI guide missing required English fields");
  }

  return guide;
}
