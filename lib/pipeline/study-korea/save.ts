import { createClient } from "@supabase/supabase-js";
import {
  naverPostSourceId,
  normalizeNaverPostUrl,
} from "./naver-url";
import { categoryToSubcategory, normalizeStudyKoreaCategory } from "./categories";
import type { StudyKoreaPostInput } from "./types";
import { resolveUniversityMatch } from "./university-id";
import { generateSlug } from "@/lib/utils/slug";

const NAVER_SOURCES = new Set(["naver_blog", "naver_news"]);

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
  const category = normalizeStudyKoreaCategory(row.category);
  const subcategory = row.subcategory
    ? categoryToSubcategory(normalizeStudyKoreaCategory(row.subcategory))
    : categoryToSubcategory(category);
  const slugOrText = row.university ?? "";

  let source_id = row.source_id;
  let url = row.url ?? "";
  const onConflict =
    NAVER_SOURCES.has(row.source) && url
      ? "source,url"
      : "source,source_id";

  if (NAVER_SOURCES.has(row.source) && url) {
    url = normalizeNaverPostUrl(url);
    source_id = naverPostSourceId(url, row.source === "naver_blog" ? "blog" : "news");

    const { data: existing } = await supabase
      .from("study_korea_posts")
      .select("source_id")
      .eq("source", row.source)
      .eq("url", url)
      .maybeSingle();

    if (existing?.source_id) {
      source_id = existing.source_id as string;
    }
  }

  let university_id = row.university_id ?? null;
  let university = slugOrText;

  if (university_id == null && slugOrText) {
    const match = await resolveUniversityMatch(
      slugOrText,
      `${row.title} ${(row.content ?? "").slice(0, 300)}`
    );
    university_id = match.id;
    university = match.slug || slugOrText;
  } else if (university_id != null && !slugOrText) {
    const match = await resolveUniversityMatch("", row.title);
    university = match.slug || university;
  }

  const slugSource = (row.ai_title_en || row.title || "post").trim();
  const slug = generateSlug(slugSource, source_id);

  const payload = {
    source: row.source,
    source_id,
    slug,
    title: row.title,
    content: row.content ?? "",
    url,
    author: row.author,
    category,
    subcategory,
    university,
    university_id,
    language: row.language ?? "ko",
    upvotes: row.upvotes,
    comment_count: row.comment_count,
    ai_summary: row.ai_summary ?? "",
    ai_summary_kr: row.ai_summary_kr ?? "",
    ai_title_en: row.ai_title_en ?? "",
    ai_summary_en: row.ai_summary_en ?? "",
    ai_content_en: row.ai_content_en ?? "",
    ai_tags: row.ai_tags ?? [],
    is_published: row.is_published ?? true,
    source_created_at: row.source_created_at,
  };

  console.log(
    `[study-korea] upsert ${row.source}/${source_id} url=${url.slice(0, 60)} conflict=${onConflict}`
  );

  const { data, error } = await supabase
    .from("study_korea_posts")
    .upsert(payload, { onConflict })
    .select("id")
    .single();

  if (error) {
    console.error(
      `[study-korea] upsert FAILED ${row.source}/${source_id}:`,
      error.message
    );
    return "failed";
  }

  console.log(
    `[study-korea] upsert OK ${row.source}/${source_id} id=${data?.id ?? "?"}`
  );
  return "saved";
}
