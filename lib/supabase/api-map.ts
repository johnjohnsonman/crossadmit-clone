import type { Admission, AdmissionSchool } from "@/lib/supabase/types";

/** 목록/상세 API 응답용 (클라이언트 호환) */
export type AdmissionApiRecord = {
  id: string
  numericId: number
  user_handle: string
  year: number
  title: string
  input_score: string
  input_gpa: string
  input_specialty: string
  view_count: number
  likes_count: number
  is_featured: boolean
  is_verified: boolean
  created_at: string
  schools: AdmissionSchool[]
  /** 등록 학교 라벨 (목록용) */
  registered_label?: string
  primary_admission_type?: string
}

export function admissionToApiRecord(a: Admission): AdmissionApiRecord {
  const schools = a.admission_schools ?? [];
  const registered = schools.find((s) => s.is_regist);
  const primaryType =
    registered?.admission_type ||
    schools.find((s) => s.admission_type)?.admission_type ||
    "";

  return {
    id: String(a.id),
    numericId: a.id,
    user_handle: a.user_handle,
    year: a.year,
    title: a.title || `${a.year}년 합격 정보`,
    input_score: a.input_score,
    input_gpa: a.input_gpa,
    input_specialty: a.input_specialty,
    view_count: a.view_count,
    likes_count: a.likes_count,
    is_featured: a.is_featured,
    is_verified: a.is_verified,
    created_at: a.created_at,
    schools,
    registered_label: registered
      ? `${registered.univ_name} ${registered.dept_name}`.trim()
      : undefined,
    primary_admission_type: primaryType,
  };
}

export function crossStatToComparisonCard(
  s: import("@/lib/supabase/types").CrossComparisonStat
) {
  const pctWin = s.percentage_win;
  const pctLose = 100 - pctWin;
  const slug = `${s.univ_id_win}-vs-${s.univ_id_lose}-${s.dept_id_win ?? 0}-${s.dept_id_lose ?? 0}`;
  return {
    id: slug,
    university1: s.univ_name_win,
    university2: s.univ_name_lose,
    dept1: s.dept_name_win,
    dept2: s.dept_name_lose,
    totalAdmitted: s.count,
    choseUniversity1: Math.round((s.count * pctWin) / 100),
    choseUniversity2: Math.round((s.count * pctLose) / 100),
    percentage1: pctWin,
    percentage2: pctLose,
    confidenceInterval1: { min: Math.max(0, pctWin - 5), max: Math.min(100, pctWin + 5) },
    confidenceInterval2: { min: Math.max(0, pctLose - 5), max: Math.min(100, pctLose + 5) },
  };
}
