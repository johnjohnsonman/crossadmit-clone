import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const MODEL = "claude-haiku-4-5-20251001";
const BATCH_SIZE = 10;

export type RematchDetail = {
  nickname: string;
  matched: string | null;
  university_id?: number;
  confidence: string;
  applied?: boolean;
  note?: string;
  error?: string;
  raw?: string;
};

export type RematchBatchResult = {
  success: true;
  processed: number;
  matched_high: number;
  matched_medium: number;
  matched_low: number;
  no_match: number;
  remaining: number;
  details: RematchDetail[];
};

export type RematchStats = {
  total: number;
  matched: number;
  unmatched: number;
  match_rate: number;
};

export async function getMentorUniversityRematchStats(): Promise<RematchStats> {
  const supabase = createAdminClient();

  const { count: total } = await supabase
    .from("mentors")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("is_legacy", true);

  const { count: matched } = await supabase
    .from("mentors")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("is_legacy", true)
    .not("university_id", "is", null);

  const totalN = total ?? 0;
  const matchedN = matched ?? 0;

  return {
    total: totalN,
    matched: matchedN,
    unmatched: Math.max(0, totalN - matchedN),
    match_rate: totalN ? Math.round((matchedN / totalN) * 100) : 0,
  };
}

function parseMatchJson(text: string): {
  university_id: number | null;
  confidence: string;
  matched_name: string | null;
} | null {
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      university_id?: number | null;
      confidence?: string;
      matched_name?: string | null;
    };
    const uid = parsed.university_id;
    return {
      university_id:
        typeof uid === "number" && Number.isFinite(uid) ? uid : null,
      confidence: String(parsed.confidence ?? "low"),
      matched_name: parsed.matched_name ? String(parsed.matched_name) : null,
    };
  } catch {
    return null;
  }
}

export async function runMentorUniversityRematchBatch(): Promise<
  RematchBatchResult & { message?: string }
> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const supabase = createAdminClient();

  const { data: unmatched, error: e1 } = await supabase
    .from("mentors")
    .select("id, nickname, intro_kr, greeting, university_name_freetext")
    .is("university_id", null)
    .eq("is_active", true)
    .eq("is_legacy", true)
    .order("view_count", { ascending: false })
    .limit(BATCH_SIZE);

  if (e1) throw new Error(e1.message);

  if (!unmatched?.length) {
    const stats = await getMentorUniversityRematchStats();
    return {
      success: true,
      processed: 0,
      matched_high: 0,
      matched_medium: 0,
      matched_low: 0,
      no_match: 0,
      remaining: stats.unmatched,
      details: [],
      message: "매칭할 멘토가 없습니다 (모두 매칭 완료)",
    };
  }

  const { data: universities, error: e2 } = await supabase
    .from("universities")
    .select("id, name_kr, name_en")
    .eq("is_active", true)
    .order("id");

  if (e2) throw new Error(e2.message);

  const validIds = new Set((universities ?? []).map((u) => u.id as number));
  const universitiesList = (universities ?? [])
    .map((u) => `${u.id}: ${u.name_kr} (${u.name_en || ""})`)
    .join("\n");

  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = `You are analyzing a mentor's self-introduction to identify their university from a provided list.

Rules:
- Match the PRIMARY university (where they study/studied)
- If multiple schools mentioned, pick the most prominent/current one
- Match Korean and English names: "성균관대" = Sungkyunkwan University
- Match abbreviations: "Haas MBA" = UC Berkeley (Haas business school)
- Match informal names: "고대" = 고려대학교, "연대" = 연세대학교, "Wharton" = UPenn
- Confidence: high = explicit name; medium = clear inference; low = weak/ambiguous
- If unclear or no school mentioned, return null for university_id

Return ONLY JSON:
{"university_id": <number or null>, "confidence": "high"|"medium"|"low", "matched_name": "<name>"}`;

  const details: RematchDetail[] = [];
  let matched_high = 0;
  let matched_medium = 0;
  let matched_low = 0;
  let no_match = 0;

  for (const mentor of unmatched) {
    try {
      const userPrompt = `Mentor: ${mentor.nickname}
Self-introduction: ${mentor.intro_kr || "(empty)"}
Greeting: ${mentor.greeting || "(none)"}

Available Universities:
${universitiesList}`;

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const block = response.content.find((b) => b.type === "text");
      const text = block?.type === "text" ? block.text : "";
      const result = parseMatchJson(text);

      if (!result) {
        details.push({
          nickname: mentor.nickname,
          matched: null,
          confidence: "parse_error",
          raw: text.slice(0, 100),
        });
        no_match++;
        continue;
      }

      const uid =
        result.university_id && validIds.has(result.university_id)
          ? result.university_id
          : null;

      if (uid && result.confidence !== "low") {
        await supabase
          .from("mentors")
          .update({
            university_id: uid,
            university_name_freetext: result.matched_name,
          })
          .eq("id", mentor.id);

        if (result.confidence === "high") matched_high++;
        else matched_medium++;

        details.push({
          nickname: mentor.nickname,
          matched: result.matched_name,
          university_id: uid,
          confidence: result.confidence,
          applied: true,
        });
      } else if (uid && result.confidence === "low") {
        await supabase
          .from("mentors")
          .update({ university_name_freetext: result.matched_name })
          .eq("id", mentor.id);
        matched_low++;
        details.push({
          nickname: mentor.nickname,
          matched: result.matched_name,
          confidence: "low",
          applied: false,
          note: "Low confidence, freetext only",
        });
      } else if (result.matched_name) {
        await supabase
          .from("mentors")
          .update({ university_name_freetext: result.matched_name })
          .eq("id", mentor.id);
        matched_low++;
        details.push({
          nickname: mentor.nickname,
          matched: result.matched_name,
          confidence: result.confidence,
          applied: false,
          note: "No valid university_id",
        });
      } else {
        no_match++;
        details.push({
          nickname: mentor.nickname,
          matched: null,
          confidence: "none",
          applied: false,
        });
      }
    } catch (err) {
      details.push({
        nickname: mentor.nickname,
        matched: null,
        confidence: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
      no_match++;
    }
  }

  const stats = await getMentorUniversityRematchStats();

  return {
    success: true,
    processed: unmatched.length,
    matched_high,
    matched_medium,
    matched_low,
    no_match,
    remaining: stats.unmatched,
    details,
  };
}
