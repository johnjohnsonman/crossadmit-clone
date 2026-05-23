import type { MigrateStep } from "@/lib/admissions/migrate-step-error";
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
  const schools = Array.isArray(raw.schools)
    ? raw.schools.map((s) => ({
        univ_id:
          typeof s.univ_id === "number" && s.univ_id > 0 ? s.univ_id : null,
        univ_name: String(s.univ_name ?? "").trim() || "미상",
        dept_name: String(s.dept_name ?? "").trim() || "미상",
        is_accept: Boolean(s.is_accept),
        is_regist: Boolean(s.is_regist),
      }))
    : [];

  let registSeen = false;
  const normalizedSchools = schools.map((s) => {
    let is_regist = s.is_regist;
    if (is_regist) {
      if (registSeen) is_regist = false;
      else registSeen = true;
    }
    return { ...s, is_regist };
  });

  const conf = raw.confidence;
  const confidence =
    conf === "high" || conf === "medium" || conf === "low" || conf === "skip"
      ? conf
      : "low";

  return {
    year: typeof raw.year === "number" ? raw.year : new Date().getFullYear() - 1,
    admission_type: String(raw.admission_type ?? "기타").trim() || "기타",
    schools: normalizedSchools.length > 0 ? normalizedSchools : [
      {
        univ_id: null,
        univ_name: "미상",
        dept_name: "미상",
        is_accept: true,
        is_regist: false,
      },
    ],
    nickname: String(raw.nickname ?? "익명").trim() || "익명",
    review: String(raw.review ?? "").trim(),
    exam_score: raw.exam_score ?? null,
    gpa: raw.gpa ?? null,
    test_scores: raw.test_scores ?? null,
    extra_activities: raw.extra_activities ?? null,
    confidence,
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
  if (extracted.confidence === "skip") {
    console.log("[MIGRATE] confidence_check: skip");
    return {
      success: false,
      status: 400,
      step: "confidence_check",
      error:
        "외국 대학 후기로 한국 대학 타겟과 맞지 않음. 포럼으로 이관을 권장합니다.",
      extracted,
      suggest_forum: true,
    };
  }

  console.log("[MIGRATE] confidence_check: ok", extracted.confidence);

  const specFields = mapExtractedToAdmissionFields(extracted);
  const year =
    extracted.year > 1990 && extracted.year <= new Date().getFullYear() + 1
      ? extracted.year
      : new Date().getFullYear() - 1;

  const primary =
    extracted.schools.find((s) => s.is_regist) ??
    extracted.schools.find((s) => s.is_accept) ??
    extracted.schools[0];

  if (!primary) {
    return {
      success: false,
      status: 400,
      step: "confidence_check",
      error: "추출된 학교 정보가 없습니다.",
      extracted,
    };
  }

  const autoTitle = `${primary.univ_name} ${primary.dept_name} · ${year}년 합격 후기`;
  const sourceUrl = post.url?.trim() || null;

  const admissionPayload = {
    original_user_id: 0,
    user_handle: extracted.nickname || "익명",
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
    extracted.review || post.content || post.title || "";

  const schoolRows = [];
  for (const school of extracted.schools) {
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
      univ_name: String(school.univ_name ?? "").trim() || "미상",
      dept_name: String(school.dept_name ?? "").trim() || "미상",
      is_apply: true,
      is_accept: school.is_accept,
      is_regist: school.is_regist,
      is_grad: false,
      admission_type: extracted.admission_type || "기타",
      review: reviewText,
      thumbnail: "",
    });
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
