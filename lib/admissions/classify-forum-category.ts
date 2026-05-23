import Anthropic from "@anthropic-ai/sdk";
import {
  normalizeStudyKoreaCategory,
  type StudyKoreaCategory,
} from "@/lib/pipeline/study-korea/categories";

const MODEL = "claude-haiku-4-5-20251001";

const VALID_FORUM_CATEGORIES = [
  "admission",
  "scholarship",
  "visa",
  "campus_life",
  "settlement",
  "language",
  "living_cost",
  "culture",
  "employment",
  "dormitory",
] as const;

const SYSTEM_PROMPT = `Classify Korean university / study-in-Korea post into ONE category:
- admission (입시, 합격, 지원)
- scholarship (장학금)
- visa (비자)
- campus_life (캠퍼스 생활)
- settlement (정착, 주거)
- language (한국어, TOPIK)
- living_cost (생활비)
- culture (문화)
- employment (취업)
- dormitory (기숙사)

Return ONLY the category name (one word, lowercase).`;

export async function classifyForumCategory(
  title: string,
  content: string
): Promise<StudyKoreaCategory> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return normalizeStudyKoreaCategory("admission");
  }

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Title: ${title}\n\nContent: ${content.slice(0, 4000)}`,
      },
    ],
  });

  const block = response.content[0];
  const text =
    block.type === "text"
      ? block.text.trim().toLowerCase().replace(/\s+/g, "_")
      : "";

  if (VALID_FORUM_CATEGORIES.includes(text as (typeof VALID_FORUM_CATEGORIES)[number])) {
    return normalizeStudyKoreaCategory(text);
  }

  return normalizeStudyKoreaCategory("admission");
}
