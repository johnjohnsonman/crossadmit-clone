import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS_EN = 4000;
const MAX_TOKENS_KR = 4000;

export type AIGuideTopicInput = {
  topic_title: string;
  category: string;
  keywords: string[];
  reference_urls?: string[];
};

export type EnglishGuideResult = {
  title_en: string;
  summary_en: string;
  content_en: string;
  sources: string[];
};

export type KoreanGuideTranslation = {
  title_kr: string;
  summary_kr: string;
  content_kr: string;
};

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

async function callClaude(
  system: string,
  user: string,
  maxTokens: number
): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text");
  }
  return block.text.trim();
}

/** Parse markdown: first # heading = title, first paragraph = summary, body = full text */
export function parseMarkdownGuide(markdown: string): {
  title: string;
  summary: string;
  body: string;
} {
  const text = markdown.trim();
  const lines = text.split("\n");

  let title = "";
  let titleLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+)/);
    if (m) {
      title = m[1].trim();
      titleLineIdx = i;
      break;
    }
  }

  const afterTitle =
    titleLineIdx >= 0 ? lines.slice(titleLineIdx + 1).join("\n").trim() : text;

  const paragraphs = afterTitle
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#"));

  const summaryRaw = paragraphs[0] ?? "";
  const summary = summaryRaw.replace(/\s+/g, " ").slice(0, 300);

  const body = text.length > 0 ? text : afterTitle;

  return {
    title: title || "Study in Korea Guide",
    summary: summary || title,
    body: body || text,
  };
}

function extractUrls(text: string): string[] {
  const urls = text.match(/https?:\/\/[^\s)\]>]+/g) ?? [];
  return [...new Set(urls.map((u) => u.replace(/[.,;]+$/, "")))];
}

export async function generateEnglishGuide(
  topic: AIGuideTopicInput
): Promise<EnglishGuideResult> {
  const refs =
    topic.reference_urls?.length ?
      `\nReference URLs: ${topic.reference_urls.join(", ")}`
    : "";

  const system = `Create a factual guide for international students in Korea.
Rules: Only factual information. No fake personal experiences. Use clear English.
End with: **Always verify with official sources.**`;

  const user = `Topic: ${topic.topic_title}
Category: ${topic.category}
Keywords: ${topic.keywords.join(", ")}${refs}

Write a Markdown guide (600-1000 words):
- Start with a single # title line
- Then a short intro paragraph
- Include: introduction, key points, practical steps, official source links

Output Markdown only. No JSON.`;

  const raw = await callClaude(system, user, MAX_TOKENS_EN);
  const parsed = parseMarkdownGuide(raw);
  const sources = [
    ...(topic.reference_urls ?? []),
    ...extractUrls(raw),
  ].filter((u, i, a) => u && a.indexOf(u) === i);

  return {
    title_en: parsed.title,
    summary_en: parsed.summary.slice(0, 300),
    content_en: parsed.body,
    sources,
  };
}

export async function translateGuideToKorean(input: {
  title_en: string;
  summary_en: string;
  content_en: string;
}): Promise<KoreanGuideTranslation> {
  const system =
    "Translate the English guide to Korean. Keep Markdown formatting. Use natural Korean. Output Markdown only.";

  const user = `Translate to Korean.

English title: ${input.title_en}
English summary: ${input.summary_en}

English guide:
${input.content_en}

Format:
- First line: # Korean title
- Then Korean body (full translation)
- Keep headings and lists`;

  const raw = await callClaude(system, user, MAX_TOKENS_KR);
  const parsed = parseMarkdownGuide(raw);

  return {
    title_kr: parsed.title,
    summary_kr: parsed.summary.slice(0, 300),
    content_kr: parsed.body,
  };
}
