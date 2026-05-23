/**
 * Backfill ai_title_en, ai_summary_en, ai_content_en for existing study_korea_posts.
 *
 * Usage:
 *   npm run backfill:en
 *   npm run backfill:en -- --limit 50
 *
 * Requires .env.local: ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { translateStudyKoreaContent } from "../lib/pipeline/study-korea/claude";

const BATCH = 10;
const DELAY_MS = 1500;

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnv();

  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const limitIdx = process.argv.indexOf("--limit");
  const maxTotal =
    limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1] ?? "0", 10) : Infinity;

  const supabase = createClient(url, key);

  let processed = 0;
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`Backfill English fields (batch=${BATCH}, delay=${DELAY_MS}ms)`);

  while (processed < maxTotal) {
    const take = Math.min(BATCH, maxTotal - processed);
    const { data: rows, error } = await supabase
      .from("study_korea_posts")
      .select("id, title, content, ai_title_en")
      .eq("is_published", true)
      .or("ai_title_en.is.null,ai_title_en.eq.")
      .order("created_at", { ascending: false })
      .limit(take);

    if (error) {
      console.error("Fetch error:", error.message);
      break;
    }
    if (!rows?.length) {
      console.log("No more rows to backfill.");
      break;
    }

    for (const row of rows) {
      processed++;
      const title = String(row.title ?? "").trim();
      const content = String(row.content ?? "").trim();
      if (!title && !content) {
        skipped++;
        continue;
      }

      try {
        const en = await translateStudyKoreaContent(title, content);
        const { error: upErr } = await supabase
          .from("study_korea_posts")
          .update({
            ai_title_en: en.ai_title_en,
            ai_summary_en: en.ai_summary_en,
            ai_content_en: en.ai_content_en,
          })
          .eq("id", row.id);

        if (upErr) throw new Error(upErr.message);
        updated++;
        console.log(`  OK ${row.id} — ${en.ai_title_en.slice(0, 50)}…`);
      } catch (e) {
        failed++;
        console.warn(
          `  FAIL ${row.id}:`,
          e instanceof Error ? e.message : e
        );
      }

      await sleep(DELAY_MS);
    }
  }

  console.log("\n=== Done ===");
  console.log(`  processed: ${processed}`);
  console.log(`  updated:   ${updated}`);
  console.log(`  failed:    ${failed}`);
  console.log(`  skipped:   ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
