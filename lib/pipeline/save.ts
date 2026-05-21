import { createClient } from "@supabase/supabase-js";
import type { ProcessedAdmission } from "../../scripts/sources/types";
import type { AdmissionsInsert, Database } from "../supabase/types";

export interface SaveResult {
  inserted: number;
  skipped: number;
  failed: number;
}

function admissionId(source: string, sourceUrl: string): string {
  const slug = sourceUrl.replace(/[^a-zA-Z0-9]/g, "").slice(-40);
  return `${source.replace(/\//g, "-")}-${slug}`;
}

function toInsertRow(item: ProcessedAdmission): AdmissionsInsert {
  const reviewParts = [
    item.summary,
    item.pros.length ? `\n\nPros:\n- ${item.pros.join("\n- ")}` : "",
    item.cons.length ? `\n\nCons:\n- ${item.cons.join("\n- ")}` : "",
    item.tips.length ? `\n\nTips:\n- ${item.tips.join("\n- ")}` : "",
  ];

  return {
    id: admissionId(item.source, item.source_url),
    university: item.university ?? "미상",
    university_en: item.university_en ?? item.university ?? "Unknown",
    major: item.major ?? "유학 경험",
    year: item.year ?? new Date().getFullYear(),
    admission_type: "유학",
    status: item.status ?? "경험공유",
    created_at: new Date().toISOString(),
    source: item.source,
    nationality: item.nationality ?? null,
    username:
      item.source === "youtube"
        ? item.source_author
        : item.source_author
          ? `u/${item.source_author}`
          : null,
    test_scores: {
      type: "study_abroad_experience",
      topik_level: item.topik_level ?? null,
      language_proficiency: item.language_proficiency ?? {},
      original_language: item.original_language,
      relevance_score: item.relevance_score,
      source_url: item.source_url,
      ...(item.published !== undefined ? { published: item.published } : {}),
    },
    gpa: null,
    special_skills: item.tips.length ? item.tips : null,
    review: reviewParts.join("").trim(),
    likes: 0,
    comments: null,
  };
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }
  return createClient<Database>(url, key);
}

/**
 * ProcessedAdmission을 Supabase admissions 테이블에 저장합니다.
 * source_url 기준으로 기존 id가 있으면 건너뜁니다.
 */
export async function saveAdmissions(
  items: ProcessedAdmission[]
): Promise<SaveResult> {
  const supabase = getSupabaseAdmin();
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    const row = toInsertRow(item);

    const { data: existing } = await supabase
      .from("admissions")
      .select("id")
      .eq("id", row.id)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("admissions").insert(row);

    if (error) {
      console.error(`[save] failed ${row.id}:`, error.message);
      failed++;
    } else {
      inserted++;
    }
  }

  return { inserted, skipped, failed };
}

/**
 * source=youtube 레코드의 source_url 집합을 반환합니다.
 */
export async function getExistingYouTubeSourceUrls(
  urls: string[]
): Promise<Set<string>> {
  if (urls.length === 0) return new Set();

  const supabase = getSupabaseAdmin();
  const existing = new Set<string>();

  const { data, error } = await supabase
    .from("admissions")
    .select("test_scores")
    .eq("source", "youtube");

  if (error) {
    console.error("[save] existing URL lookup failed:", error.message);
    return existing;
  }

  const urlSet = new Set(urls);
  for (const row of data ?? []) {
    const scores = row.test_scores as { source_url?: string } | null;
    if (scores?.source_url && urlSet.has(scores.source_url)) {
      existing.add(scores.source_url);
    }
  }

  return existing;
}
