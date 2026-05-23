import type { MigrateStep } from "@/lib/admissions/migrate-step-error";
import {
  sanitizeExtractedSchools,
} from "@/lib/admissions/sanitize-schools";
import {
  normalizeUnivId,
  resolveDepartmentId,
} from "@/lib/admissions/resolve-school-ids";
import type { ExtractedAdmission } from "@/lib/pipeline/study-korea/extract-admission-review";
import { mapExtractedToAdmissionFields } from "@/lib/pipeline/study-korea/extract-admission-review";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type StudyKoreaPostRow = {
  id: string;
  title: string | null;
  content: string | null;
  url: string | null;
};

function toFkId(id: number | null | undefined): number | null {
  if (id == null || id <= 0) return null;
  return id;
}

/** API overrides → ExtractedAdmission */
export function normalizeExtractedOverrides(
  raw: Partial<ExtractedAdmission>
): ExtractedAdmission {
  const conf = raw.confidence;
  const confidence =
    conf === "high" || conf === "medium" || conf === "low" || conf === "skip"
      ? conf
      : "low";

  const base: ExtractedAdmission = {
    year: typeof raw.year === "number" ? raw.year : new Date().getFullYear() - 1,
    admission_type: String(raw.admission_type ?? "기타").trim() || "기타",
    schools: Array.isArray(raw.schools) ? raw.schools : [],
    nickname: String(raw.nickname ?? "익명").trim() || "익명",
    review: String(raw.review ?? "").trim(),
    exam_score: raw.exam_score ?? null,
    gpa: raw.gpa ?? null,
    test_scores: raw.test_scores ?? null,
    extra_activities: raw.extra_activities ?? null,
    confidence,
  };

  const sanitized = sanitizeExtractedSchools(base);
  if (sanitized.schools.length > 0) return sanitized;

  return {
    ...sanitized,
    schools: [
      {
        univ_id: null,
        univ_name: "미상",
        dept_name: "미상",
        is_accept: true,
        is_regist: false,
      },
    ],
  };
}

export async function migrateStudyKoreaPostToAdmission(
  supabase: AdminClient,
  postId: string,
  post: StudyKoreaPostRow,
  extracted: ExtractedAdmission
): Promise<
  | { success: true; admission_id: number; schools_count: number; source_url: string | null }
  | {
      success: false;
      error: string;
      status: number;
      step?: MigrateStep;
      extracted?: ExtractedAdmission;
      suggest_forum?: boolean;
    }
> {
  const extractedSafe = sanitizeExtractedSchools(extracted);

  if (extractedSafe.confidence === "skip") {
    console.log("[MIGRATE] confidence_check: skip");
    return {
      success: false,
      status: 400,
      step: "confidence_check",
      error:
        "외국 대학 후기로 한국 대학 타겟과 맞지 않음. 포럼으로 이관을 권장합니다.",
      extracted: extractedSafe,
      suggest_forum: true,
    };
  }

  if (extractedSafe.schools.length === 0) {
    return {
      success: false,
      status: 400,
      step: "confidence_check",
      error:
        "Claude가 학교 정보를 추출하지 못함. 본문이 너무 짧거나 학교명이 명확하지 않음.",
      extracted: extractedSafe,
    };
  }

  console.log("[MIGRATE] confidence_check: ok", extractedSafe.confidence);

  const specFields = mapExtractedToAdmissionFields(extractedSafe);
  const year =
    extractedSafe.year > 1990 &&
    extractedSafe.year <= new Date().getFullYear() + 1
      ? extractedSafe.year
      : new Date().getFullYear() - 1;

  const primary =
    extractedSafe.schools.find((s) => s.is_regist) ??
    extractedSafe.schools.find((s) => s.is_accept) ??
    extractedSafe.schools[0]!;

  const schools = extractedSafe.schools;

  const autoTitle = `${primary.univ_name} ${primary.dept_name} · ${year}년 합격 후기`;
  const sourceUrl = post.url?.trim() || null;

  const admissionPayload = {
    original_user_id: 0,
    user_handle: extractedSafe.nickname || "익명",
    year,
    year_end: year,
    title: autoTitle,
    input_score: specFields.input_score,
    input_gpa: specFields.input_gpa,
    input_specialty: specFields.input_specialty,
    view_count: 0,
    likes_count: 0,
    is_verified: false,
    is_featured: false,
    published: true,
    source: "auto_collected",
    source_url: sourceUrl,
    created_at: new Date().toISOString(),
  };

  console.log("[MIGRATE] admissions_insert: start", {
    title: autoTitle,
    source_url: sourceUrl,
  });

  let admission: { id: number } | null = null;
  let aError: { message: string } | null = null;

  const firstInsert = await supabase
    .from("admissions")
    .insert(admissionPayload)
    .select("id")
    .single();

  admission = firstInsert.data as { id: number } | null;
  aError = firstInsert.error;

  if (aError && /source_url/i.test(aError.message)) {
    console.warn(
      "[MIGRATE] admissions_insert: source_url column missing, retry without"
    );
    const { source_url: _drop, ...withoutSourceUrl } = admissionPayload;
    const retry = await supabase
      .from("admissions")
      .insert(withoutSourceUrl)
      .select("id")
      .single();
    admission = retry.data as { id: number } | null;
    aError = retry.error;
  }

  if (aError || !admission) {
    console.error("[MIGRATE] admissions_insert failed:", aError?.message);
    return {
      success: false,
      status: 500,
      step: "admissions_insert",
      error:
        aError?.message ??
        "admissions insert failed (020_admission_source_url.sql 실행 여부 확인)",
    };
  }

  const admissionId = admission.id as number;
  const reviewText =
    extractedSafe.review || post.content || post.title || "";

  const schoolRows = [];
  for (const school of schools) {
    if (!school?.univ_name?.trim()) continue;

    const univId = await normalizeUnivId(supabase, school.univ_id ?? undefined);
    const deptId = await resolveDepartmentId(
      supabase,
      univId,
      school.dept_name
    );
    schoolRows.push({
      admission_id: admissionId,
      univ_id: toFkId(univId),
      dept_id: toFkId(deptId),
      univ_name: school.univ_name.trim(),
      dept_name: school.dept_name.trim() || "미상",
      is_apply: true,
      is_accept: Boolean(school.is_accept),
      is_regist: Boolean(school.is_regist),
      is_grad: false,
      admission_type: extractedSafe.admission_type || "기타",
      review: reviewText,
      thumbnail: "",
    });
  }

  if (schoolRows.length === 0) {
    await supabase.from("admissions").delete().eq("id", admissionId);
    return {
      success: false,
      status: 400,
      step: "admission_schools_insert",
      error: "저장 가능한 학교 정보가 없습니다.",
      extracted: extractedSafe,
    };
  }

  console.log("[MIGRATE] admission_schools_insert:", schoolRows.length);

  const { error: schoolErr } = await supabase
    .from("admission_schools")
    .insert(schoolRows);

  if (schoolErr) {
    console.error("[MIGRATE] admission_schools_insert failed:", schoolErr.message);
    await supabase.from("admissions").delete().eq("id", admissionId);
    return {
      success: false,
      status: 500,
      step: "admission_schools_insert",
      error: schoolErr.message,
    };
  }

  const { error: postUpdateErr } = await supabase
    .from("study_korea_posts")
    .update({
      is_admission_post: false,
      moderation_status: "migrated",
    })
    .eq("id", postId);

  if (postUpdateErr) {
    console.error(
      "[MIGRATE] study_korea_posts_update failed:",
      postUpdateErr.message
    );
    return {
      success: false,
      status: 500,
      step: "study_korea_posts_update",
      error: postUpdateErr.message,
    };
  }

  console.log("[MIGRATE] done admission_id:", admissionId);

  return {
    success: true,
    admission_id: admissionId,
    schools_count: schoolRows.length,
    source_url: post.url?.trim() || null,
  };
}
