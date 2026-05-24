/**
 * One-shot classifier smoke test (requires ANTHROPIC_API_KEY in .env.local).
 * Usage: node --env-file=.env.local scripts/test-classifier.mjs
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

const fixture = {
  title: "Got accepted to Yonsei University as international student!",
  body: `I am so happy to share that I got admitted to Yonsei University for Fall 2025 international track.
  My stats: IB 38, TOEFL 105, decent extracurriculars in debate.
  Happy to answer questions about the application process.`,
  source: "reddit",
  url: "https://www.reddit.com/r/StudyInKorea/comments/test_fixture",
};

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY missing");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const prompt = `Return ONLY JSON: {"is_admission_story":true,"is_korean_university":true,"confidence":0.9}
Post: ${fixture.title}\n${fixture.body}`;

  console.log("[test-classifier] calling", MODEL);
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  console.log("[test-classifier] response:", text);
  console.log("[test-classifier] usage:", message.usage);
}

main().catch((e) => {
  console.error("[test-classifier] failed:", e);
  process.exit(1);
});
