import { createClient } from "@supabase/supabase-js";
import type { StudyKoreaPostInput, StudyKoreaSubcategory } from "./types";
import { resolveUniversityId } from "./university-id";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars missing");
  return createClient(url, key);
}

function toSubcategory(
  row: StudyKoreaPostInput
): StudyKoreaSubcategory {
  const sub = row.subcategory ?? row.category ?? "general";
  const allowed: StudyKoreaSubcategory[] = [
    "admission",
    "scholarship",
    "visa",
    "dormitory",
    "life",
    "language",
    "general",
  ];
  return allowed.includes(sub as StudyKoreaSubcategory)
    ? (sub as StudyKoreaSubcategory)
    : "general";
}

export async function upsertStudyKoreaPost(
  row: StudyKoreaPostInput
): Promise<"saved" | "failed"> {
  const supabase = admin();
  const subcategory = toSubcategory(row);
  const universitySlug = row.university ?? "";
  const university_id =
    row.university_id !== undefined
      ? row.university_id
      : await resolveUniversityId(universitySlug);

  const payload = {
    source: row.source,
    source_id: row.source_id,
    title: row.title,
    content: row.content ?? "",
    url: row.url,
    author: row.author,
    category: row.category ?? subcategory,
    subcategory,
    university: universitySlug,
    university_id,
    language: row.language ?? "ko",
    upvotes: row.upvotes,
    comment_count: row.comment_count,
    ai_summary: row.ai_summary ?? "",
    ai_summary_kr: row.ai_summary_kr ?? "",
    ai_tags: row.ai_tags ?? [],
    is_published: row.is_published ?? true,
    source_created_at: row.source_created_at,
  };

  console.log(
    `[study-korea] upsert ${row.source}/${row.source_id} sub=${subcategory} univ_id=${university_id ?? "—"}`
  );

  const { data, error } = await supabase
    .from("study_korea_posts")
    .upsert(payload, { onConflict: "source,source_id" })
    .select("id")
    .single();

  if (error) {
    console.error(
      `[study-korea] upsert FAILED ${row.source}/${row.source_id}:`,
      error.message
    );
    return "failed";
  }

  console.log(
    `[study-korea] upsert OK ${row.source}/${row.source_id} id=${data?.id ?? "?"}`
  );
  return "saved";
}
