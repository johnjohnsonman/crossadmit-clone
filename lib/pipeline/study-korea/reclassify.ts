import type { SupabaseClient } from "@supabase/supabase-js";
import { categoryToSubcategory } from "./categories";
import { reclassifyStudyKoreaPost } from "./claude";

const BATCH_SIZE = 10;
const ITEM_DELAY_MS = 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function weekAgoIso(): string {
  return new Date(Date.now() - WEEK_MS).toISOString();
}

export type ReclassifyStatus = {
  total: number;
  reclassified: number;
  remaining: number;
  kept_published: number;
  hidden: number;
};

export async function getReclassifyStatus(
  supabase: SupabaseClient
): Promise<ReclassifyStatus> {
  const { count: total, error: totalErr } = await supabase
    .from("study_korea_posts")
    .select("id", { count: "exact", head: true });
  if (totalErr) throw new Error(totalErr.message);

  const { count: reclassified, error: reclErr } = await supabase
    .from("study_korea_posts")
    .select("id", { count: "exact", head: true })
    .not("recently_reclassified_at", "is", null);
  if (reclErr) throw new Error(reclErr.message);

  const { count: kept_published, error: keptErr } = await supabase
    .from("study_korea_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);
  if (keptErr) throw new Error(keptErr.message);

  const t = total ?? 0;
  const r = reclassified ?? 0;
  const kept = kept_published ?? 0;

  const cutoff = weekAgoIso();
  const [{ count: nullPending }, { count: stalePending }] = await Promise.all([
    supabase
      .from("study_korea_posts")
      .select("id", { count: "exact", head: true })
      .is("recently_reclassified_at", null),
    supabase
      .from("study_korea_posts")
      .select("id", { count: "exact", head: true })
      .not("recently_reclassified_at", "is", null)
      .lt("recently_reclassified_at", cutoff),
  ]);
  const remaining = (nullPending ?? 0) + (stalePending ?? 0);

  return {
    total: t,
    reclassified: r,
    remaining: remaining ?? 0,
    kept_published: kept,
    hidden: Math.max(0, t - kept),
  };
}

export type ReclassifyBatchResult = {
  processed: number;
  kept_published: number;
  hidden: number;
  failed: number;
  remaining: number;
  logs: string[];
};

export async function runReclassifyBatch(
  supabase: SupabaseClient,
  batchSize = BATCH_SIZE
): Promise<ReclassifyBatchResult> {
  const cutoff = weekAgoIso();
  const { data: candidates, error } = await supabase
    .from("study_korea_posts")
    .select(
      "id, title, content, ai_summary, ai_summary_kr, category, is_published, recently_reclassified_at"
    )
    .order("created_at", { ascending: false })
    .limit(batchSize * 3);

  const rows = (candidates ?? [])
    .filter((r) => {
      const at = r.recently_reclassified_at as string | null;
      if (!at) return true;
      return new Date(at).getTime() < new Date(cutoff).getTime();
    })
    .slice(0, batchSize);

  if (error) throw new Error(error.message);

  const result: ReclassifyBatchResult = {
    processed: 0,
    kept_published: 0,
    hidden: 0,
    failed: 0,
    remaining: 0,
    logs: [],
  };

  if (!rows?.length) {
    const status = await getReclassifyStatus(supabase);
    result.remaining = status.remaining;
    return result;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    result.processed++;
    const title = String(row.title ?? "").trim();
    const content = String(row.content ?? "").trim();
    const summary = String(row.ai_summary_kr ?? row.ai_summary ?? "").trim();
    const prevCat = String(row.category ?? "general");

    try {
      const verdict = await reclassifyStudyKoreaPost(title, content, summary);
      const subcategory = categoryToSubcategory(verdict.category);
      const is_published = verdict.is_relevant;

      const { error: upErr } = await supabase
        .from("study_korea_posts")
        .update({
          category: verdict.category,
          subcategory,
          is_published,
          recently_reclassified_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (upErr) throw new Error(upErr.message);

      if (is_published) {
        result.kept_published++;
        result.logs.push(
          `✅ Kept: '${title.slice(0, 50)}' (${prevCat} → ${verdict.category})`
        );
        console.log(
          `[reclassify] ✅ Kept: '${title.slice(0, 60)}' (${prevCat} → ${verdict.category})`
        );
      } else {
        result.hidden++;
        result.logs.push(
          `❌ Hidden: '${title.slice(0, 50)}' (${prevCat} → not_relevant)`
        );
        console.log(
          `[reclassify] ❌ Hidden: '${title.slice(0, 60)}' (${prevCat} → not_relevant) — ${verdict.reason}`
        );
      }
    } catch (e) {
      result.failed++;
      const msg = e instanceof Error ? e.message : String(e);
      result.logs.push(`⚠ FAIL ${row.id}: ${msg}`);
      console.warn(`[reclassify] FAIL ${row.id}:`, msg);
    }

    if (i < rows.length - 1) await sleep(ITEM_DELAY_MS);
  }

  const status = await getReclassifyStatus(supabase);
  result.remaining = status.remaining;
  return result;
}
