import type { Admission } from "@/lib/supabase/types";
import type { AdmissionRecord } from "@/lib/types";

/** 레거시 UI 타입 호환 (점진 제거 예정) */
export function admissionToLegacyRecord(a: Admission): AdmissionRecord {
  const reg = a.admission_schools?.find((s) => s.is_regist);
  const primary = reg ?? a.admission_schools?.[0];
  return {
    id: String(a.id),
    university: primary?.univ_name ?? "",
    universityEn: primary?.univ_name ?? "",
    major: primary?.dept_name ?? "",
    year: a.year,
    admissionType: primary?.admission_type ?? "",
    status: reg ? "등록" : primary?.is_accept ? "합격" : "불합격",
    createdAt: new Date(a.created_at),
    source: a.source as AdmissionRecord["source"],
    username: a.user_handle,
    studentHandle: a.user_handle,
    review: primary?.review ?? a.input_specialty,
    likes: a.likes_count,
    isFeatured: a.is_featured,
    published: a.published,
    verified: a.is_verified,
  };
}
