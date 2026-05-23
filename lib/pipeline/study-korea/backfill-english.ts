import { translateStudyKoreaContent } from "./claude";
import type { SupabaseClient } from "@supabase/supabase-js";

const BATCH_SIZE = 10;
const ITEM_DELAY_MS = 1000;

export type EnglishBackfillStatus = {
  total: number;
  translated: number;
  remaining: number;
};

function needsEnglish(row: { ai_title_en?: string | null }): boolean {
  return !String(row.ai_title_en ?? "").trim();
}

export async function getEnglishBackfillStatus(
  supabase: SupabaseClient
): Promise<EnglishBackfillStatus> {
  const { count: total, error: totalErr } = await supabase
    .from("study_korea_posts")
    .select("id", { count: "exact", head: true });

  if (totalErr) throw new Error(totalErr.message);

  const { count: remaining, error: remErr } = await supabase
    .from("study_korea_posts")
    .select("id", { count: "exact", head: true })
    .or("ai_title_en.is.null,ai_title_en.eq.");

  if (remErr) throw new Error(remErr.message);

  const t = total ?? 0;
  const r = remaining ?? 0;
  return { total: t, remaining: r, translated: Math.max(0, t - r) };
}

export type EnglishBackfillBatchResult = {
  processed: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: string[];
  items: { id: string; title_kr: string; title_en: string }[];
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runEnglishBackfillBatch(
  supabase: SupabaseClient,
  limit = BATCH_SIZE
): Promise<EnglishBackfillBatchResult> {
  const { data: rows, error } = await supabase
    .from("study_korea_posts")
    .select("id, title, content, ai_summary, ai_summary_kr, ai_title_en")
    .or("ai_title_en.is.null,ai_title_en.eq.")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const result: EnglishBackfillBatchResult = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    items: [],
  };

  if (!rows?.length) return result;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    if (!needsEnglish(row)) {
      result.skipped++;
      continue;
    }

    result.processed++;
    const title = String(row.title ?? "").trim();
    const content = String(row.content ?? "").trim();
    const aiSummary = String(row.ai_summary_kr ?? row.ai_summary ?? "").trim();

    if (!title && !content && !aiSummary) {
      result.skipped++;
      continue;
    }

    try {
      const en = await translateStudyKoreaContent(title, aiSummary, content);
      const { error: upErr } = await supabase
        .from("study_korea_posts")
        .update({
          ai_title_en: en.ai_title_en,
          ai_summary_en: en.ai_summary_en,
          ai_content_en: en.ai_content_en,
        })
        .eq("id", row.id);

      if (upErr) throw new Error(upErr.message);
      result.updated++;
      result.items.push({
        id: row.id,
        title_kr: title.slice(0, 80) || aiSummary.slice(0, 80),
        title_en: en.ai_title_en.slice(0, 120),
      });
    } catch (e) {
      result.failed++;
      result.errors.push(
        `${row.id}: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    if (i < rows.length - 1) {
      await sleep(ITEM_DELAY_MS);
    }
  }

  return result;
}
