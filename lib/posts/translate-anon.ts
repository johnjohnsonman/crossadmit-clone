import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

export type AnonTranslation = {
  ai_title_en: string;
  ai_summary_en: string;
  ai_summary_kr: string;
  ai_content_en: string;
};

export async function translateAnonymousPost(
  title: string,
  content: string,
  language: "en" | "ko",
  autoTranslate: boolean
): Promise<AnonTranslation> {
  if (!autoTranslate || !process.env.ANTHROPIC_API_KEY) {
    if (language === "en") {
      return {
        ai_title_en: title,
        ai_summary_en: content.slice(0, 500),
        ai_summary_kr: content.slice(0, 500),
        ai_content_en: content.slice(0, 8000),
      };
    }
    return {
      ai_title_en: title,
      ai_summary_en: content.slice(0, 500),
      ai_summary_kr: content.slice(0, 500),
      ai_content_en: content.slice(0, 8000),
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Original language: ${language}
Title: ${title}
Content: ${content.slice(0, 6000)}

Return JSON only:
{
  "ai_title_en": "English title",
  "ai_summary_en": "2-3 sentence English summary",
  "ai_summary_kr": "2-3문장 한국어 요약",
  "ai_content_en": "English body (full translation if under 800 words, else first 500 words + ...)"
}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return {
      ai_title_en: language === "en" ? title : title,
      ai_summary_en: content.slice(0, 500),
      ai_summary_kr: content.slice(0, 500),
      ai_content_en: content.slice(0, 8000),
    };
  }

  try {
    const m = block.text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m?.[0] ?? block.text) as Record<string, string>;
    return {
      ai_title_en: parsed.ai_title_en || title,
      ai_summary_en: parsed.ai_summary_en || content.slice(0, 500),
      ai_summary_kr: parsed.ai_summary_kr || content.slice(0, 500),
      ai_content_en: parsed.ai_content_en || content.slice(0, 8000),
    };
  } catch {
    return {
      ai_title_en: title,
      ai_summary_en: content.slice(0, 500),
      ai_summary_kr: content.slice(0, 500),
      ai_content_en: content.slice(0, 8000),
    };
  }
}
