import Anthropic from "@anthropic-ai/sdk";
import { normalizeStudyKoreaCategory } from "@/lib/pipeline/study-korea/categories";

const MODEL = "claude-haiku-4-5-20251001";

export type AnonModerationResult = {
  approved: boolean;
  reason: string;
  category_confirmed: string;
};

const VALID_CATEGORIES = new Set([
  "visa",
  "admission",
  "scholarship",
  "dormitory",
  "language",
  "employment",
  "culture",
  "campus_life",
  "settlement",
  "living_cost",
  "general",
]);

function parseModerationJson(text: string): AnonModerationResult {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const approved =
      parsed.approved === true || parsed.approved === "true";
    const category = String(parsed.category_confirmed ?? "general");
    const normalized = normalizeStudyKoreaCategory(
      VALID_CATEGORIES.has(category) ? category : "general"
    );
    return {
      approved,
      reason: String(parsed.reason ?? "").trim(),
      category_confirmed: normalized,
    };
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return parseModerationJson(m[0]);
    return {
      approved: false,
      reason: "Could not parse moderation response",
      category_confirmed: "general",
    };
  }
}

export async function moderateAnonymousPost(
  title: string,
  content: string,
  selectedCategory: string
): Promise<AnonModerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      approved: true,
      reason: "Moderation skipped (no API key)",
      category_confirmed: normalizeStudyKoreaCategory(selectedCategory),
    };
  }

  const client = new Anthropic({ apiKey });
  const prompt = `Evaluate if this post is appropriate for a foreign student community in Korea. Check for:
- No hate speech, harassment, or offensive language
- Not spam or advertising
- Relevant to foreign students in Korea
- No illegal content

Respond ONLY with JSON:
{
  "approved": boolean,
  "reason": "brief explanation",
  "category_confirmed": "visa|admission|scholarship|dormitory|language|employment|culture|campus_life|settlement|living_cost|general"
}

Post:
Title: ${title}
Content: ${content.slice(0, 4000)}
Selected category: ${selectedCategory}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return {
      approved: false,
      reason: "Empty moderation response",
      category_confirmed: normalizeStudyKoreaCategory(selectedCategory),
    };
  }

  return parseModerationJson(block.text);
}

export async function moderateAnonymousComment(
  content: string
): Promise<{ approved: boolean; reason: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { approved: true, reason: "skipped" };

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 128,
    messages: [
      {
        role: "user",
        content: `Is this comment OK for a foreign student forum in Korea? No hate, spam, harassment, illegal content.
Reply JSON only: {"approved":boolean,"reason":"..."}
Comment: ${content.slice(0, 1500)}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return { approved: false, reason: "empty response" };
  }

  try {
    const parsed = JSON.parse(block.text) as {
      approved?: boolean;
      reason?: string;
    };
    return {
      approved: parsed.approved !== false,
      reason: String(parsed.reason ?? ""),
    };
  } catch {
    return { approved: true, reason: "parse fallback pass" };
  }
}
