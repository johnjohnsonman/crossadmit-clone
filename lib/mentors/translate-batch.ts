import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const MODEL = "claude-haiku-4-5-20251001";
const BATCH_SIZE = 10;

async function translateText(
  client: Anthropic,
  system: string,
  text: string
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: text }],
  });
  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text.trim() : "";
}

export async function runMentorTranslationBatch(): Promise<{
  processed: number;
  updated: number;
  failed: number;
  remaining: number;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const admin = createAdminClient();
  const client = new Anthropic({ apiKey });

  const { data: rows, error } = await admin
    .from("mentors")
    .select("id, intro_kr, greeting")
    .eq("is_active", true)
    .or("intro_en.is.null,intro_en.eq.")
    .order("view_count", { ascending: false })
    .limit(BATCH_SIZE);

  if (error) throw new Error(error.message);

  const introSystem =
    "Translate this Korean mentor self-introduction to natural English for international students. Keep school names and academic terms accurate. Maintain professional yet warm tone. Length similar to original. Output plain text only.";

  const greetingSystem =
    "Translate this short Korean greeting to natural English for international students. One or two sentences. Output plain text only.";

  let updated = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    try {
      const introEn = await translateText(
        client,
        introSystem,
        String(row.intro_kr ?? "")
      );
      let greetingEn: string | null = null;
      if (row.greeting?.trim()) {
        greetingEn = await translateText(
          client,
          greetingSystem,
          String(row.greeting)
        );
      }

      const { error: updErr } = await admin
        .from("mentors")
        .update({
          intro_en: introEn,
          ...(greetingEn ? { greeting_en: greetingEn } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updErr) failed++;
      else updated++;
    } catch (e) {
      console.error("[mentor translate]", row.id, e);
      failed++;
    }
  }

  const { count: total } = await admin
    .from("mentors")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: translated } = await admin
    .from("mentors")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .not("intro_en", "is", null)
    .neq("intro_en", "");

  return {
    processed: rows?.length ?? 0,
    updated,
    failed,
    remaining: Math.max(0, (total ?? 0) - (translated ?? 0)),
  };
}
