import type { SupabaseClient } from "@supabase/supabase-js";
import { generateSlug } from "@/lib/utils/slug";

export type SlugBackfillStatus = {
  total: number;
  with_slug: number;
  remaining: number;
};

export async function getSlugBackfillStatus(
  supabase: SupabaseClient
): Promise<SlugBackfillStatus> {
  const { count: total, error: tErr } = await supabase
    .from("study_korea_posts")
    .select("id", { count: "exact", head: true });
  if (tErr) throw new Error(tErr.message);

  const { count: with_slug, error: sErr } = await supabase
    .from("study_korea_posts")
    .select("id", { count: "exact", head: true })
    .not("slug", "is", null);
  if (sErr) throw new Error(sErr.message);

  const t = total ?? 0;
  const w = with_slug ?? 0;
  return { total: t, with_slug: w, remaining: Math.max(0, t - w) };
}

export async function runSlugBackfillBatch(
  supabase: SupabaseClient,
  batchSize = 50
): Promise<{ processed: number; updated: number; failed: number }> {
  const { data: rows, error } = await supabase
    .from("study_korea_posts")
    .select("id, title, ai_title_en, slug")
    .is("slug", null)
    .limit(batchSize);

  if (error) throw new Error(error.message);

  let updated = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    const title = String(row.ai_title_en || row.title || "post").trim();
    let slug = generateSlug(title, String(row.id));
    let attempt = 0;

    while (attempt < 3) {
      const { error: upErr } = await supabase
        .from("study_korea_posts")
        .update({ slug })
        .eq("id", row.id);

      if (!upErr) {
        updated++;
        break;
      }
      if (upErr.code === "23505") {
        slug = generateSlug(title, `${row.id}-${attempt + 1}`);
        attempt++;
        continue;
      }
      failed++;
      console.error("[backfill-slug] update failed", row.id, upErr.message);
      break;
    }
  }

  return {
    processed: rows?.length ?? 0,
    updated,
    failed,
  };
}
