import { createClient } from "@supabase/supabase-js";
import type { StudyKoreaPostInput } from "./types";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars missing");
  return createClient(url, key);
}

export async function upsertStudyKoreaPost(
  row: StudyKoreaPostInput
): Promise<"saved" | "failed"> {
  const supabase = admin();

  const payload = {
    source: row.source,
    source_id: row.source_id,
    title: row.title,
    content: row.content ?? "",
    url: row.url,
    author: row.author,
    category: row.category ?? "general",
    university: row.university ?? "",
    language: row.language ?? "en",
    upvotes: row.upvotes,
    comment_count: row.comment_count,
    ai_summary: row.ai_summary ?? "",
    ai_summary_kr: row.ai_summary_kr ?? "",
    ai_tags: row.ai_tags ?? [],
    is_published: row.is_published ?? true,
    source_created_at: row.source_created_at,
  };

  console.log(
    `[study-korea] upsert ${row.source}/${row.source_id} published=${payload.is_published} title="${(row.title ?? "").slice(0, 50)}"`
  );

  const { data, error } = await supabase
    .from("study_korea_posts")
    .upsert(payload, { onConflict: "source,source_id" })
    .select("id")
    .single();

  if (error) {
    console.error(
      `[study-korea] upsert FAILED ${row.source}/${row.source_id}:`,
      error.message,
      error.details,
      error.hint
    );
    return "failed";
  }

  console.log(
    `[study-korea] upsert OK ${row.source}/${row.source_id} id=${data?.id ?? "?"}`
  );
  return "saved";
}
