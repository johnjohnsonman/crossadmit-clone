import { createClient } from "@supabase/supabase-js";
import type { ProcessedAdmission } from "../../scripts/sources/types";
import type { Database } from "../supabase/types";

export interface SaveResult {
  inserted: number;
  skipped: number;
  failed: number;
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

function reviewText(item: ProcessedAdmission): string {
  const parts = [
    item.summary,
    item.pros.length ? `\n\nPros:\n- ${item.pros.join("\n- ")}` : "",
    item.cons.length ? `\n\nCons:\n- ${item.cons.join("\n- ")}` : "",
    item.tips.length ? `\n\nTips:\n- ${item.tips.join("\n- ")}` : "",
    `\n\nsource_url: ${item.source_url}`,
  ];
  return parts.join("").trim();
}

async function nextIds(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const [{ data: maxAdm }, { data: maxSchool }] = await Promise.all([
    supabase
      .from("admissions")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("admission_schools")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    admissionId: (maxAdm?.id ?? 0) + 1,
    schoolId: (maxSchool?.id ?? 0) + 1,
  };
}

/**
 * ProcessedAdmission을 Supabase admissions + admission_schools에 저장합니다.
 * source_url이 input_specialty에 이미 있으면 건너뜁니다.
 */
export async function saveAdmissions(
  items: ProcessedAdmission[]
): Promise<SaveResult> {
  const supabase = getSupabaseAdmin();
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  const existingUrls = await getExistingYouTubeSourceUrls(
    items.map((i) => i.source_url)
  );

  let { admissionId, schoolId } = await nextIds(supabase);

  for (const item of items) {
    if (existingUrls.has(item.source_url)) {
      skipped++;
      continue;
    }

    const review = reviewText(item);
    const year = item.year ?? new Date().getFullYear();
    const univName = item.university ?? "미상";
    const deptName = item.major ?? "유학 경험";

    const { error: admErr } = await supabase.from("admissions").insert({
      id: admissionId,
      original_user_id: 0,
      user_handle:
        item.source === "youtube"
          ? (item.source_author ?? "youtube")
          : item.source_author
            ? `u/${item.source_author}`
            : "reddit",
      year,
      year_end: year,
      title: `${univName} ${deptName} (${year})`,
      input_score: "",
      input_gpa: "",
      input_specialty: review,
      view_count: 0,
      likes_count: 0,
      is_verified: false,
      is_featured: false,
      published: item.published !== false,
      source: item.source,
      created_at: new Date().toISOString(),
    });

    if (admErr) {
      console.error(`[save] failed admission ${admissionId}:`, admErr.message);
      failed++;
      continue;
    }

    const { error: schoolErr } = await supabase.from("admission_schools").insert({
      id: schoolId,
      admission_id: admissionId,
      univ_id: 0,
      dept_id: 0,
      univ_name: univName,
      dept_name: deptName,
      is_apply: true,
      is_accept: true,
      is_regist: item.status === "등록",
      is_grad: false,
      admission_type: "유학",
      review,
      thumbnail: "",
      is_active: true,
      created_at: new Date().toISOString(),
    });

    if (schoolErr) {
      console.error(`[save] failed school ${schoolId}:`, schoolErr.message);
      failed++;
    } else {
      inserted++;
      existingUrls.add(item.source_url);
    }

    admissionId += 1;
    schoolId += 1;
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
  const urlSet = new Set(urls);

  const { data, error } = await supabase
    .from("admissions")
    .select("input_specialty")
    .eq("source", "youtube");

  if (error) {
    console.error("[save] existing URL lookup failed:", error.message);
    return existing;
  }

  for (const row of data ?? []) {
    const text = String(row.input_specialty ?? "");
    const m = text.match(/source_url:\s*(\S+)/);
    if (m?.[1] && urlSet.has(m[1])) {
      existing.add(m[1]);
    }
  }

  return existing;
}
