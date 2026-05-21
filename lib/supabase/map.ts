import type {
  Admission,
  AdmissionSchool,
  CrossComparison,
} from "@/lib/supabase/types";
import type {
  AdmissionRecord,
  AdmissionSchoolRecord,
  CrossComparisonRecord,
} from "@/lib/types";

function mapSchool(row: AdmissionSchool): AdmissionSchoolRecord {
  return {
    id: row.id,
    admissionId: row.admission_id,
    univId: row.univ_id ?? 0,
    deptId: row.dept_id ?? 0,
    univName: row.univ_name ?? "",
    deptName: row.dept_name ?? "",
    isApply: Boolean(row.is_apply),
    isAccept: Boolean(row.is_accept),
    isRegist: Boolean(row.is_regist),
    isGrad: Boolean(row.is_grad),
    admissionType: row.admission_type ?? "",
    review: row.review || undefined,
    thumbnail: row.thumbnail || undefined,
  };
}

function mapCross(row: CrossComparison): CrossComparisonRecord {
  return {
    id: row.id,
    admissionId: row.admission_id,
    univIdWin: row.univ_id_win,
    univIdLose: row.univ_id_lose,
    univNameWin: row.univ_name_win,
    univNameLose: row.univ_name_lose,
    deptNameWin: row.dept_name_win,
    deptNameLose: row.dept_name_lose,
    count: row.count,
  };
}

export function admissionToRecord(
  row: Admission & {
    cross_comparisons?: CrossComparison[];
  }
): AdmissionRecord {
  const schools = (row.admission_schools ?? []).map(mapSchool);
  const crosses = row.cross_comparisons?.map(mapCross);

  return {
    id: row.id,
    userHandle: row.user_handle ?? "익명",
    year: row.year,
    yearEnd: row.year_end ?? undefined,
    title: row.title ?? "",
    inputScore: row.input_score || undefined,
    inputGpa: row.input_gpa || undefined,
    inputSpecialty: row.input_specialty || undefined,
    viewCount: row.view_count ?? 0,
    likesCount: row.likes_count ?? 0,
    isVerified: Boolean(row.is_verified),
    isFeatured: Boolean(row.is_featured),
    published: Boolean(row.published),
    source: row.source ?? "",
    createdAt: new Date(row.created_at),
    admissionSchools: schools,
    crossComparisons: crosses,
  };
}

/** 등록 학교 표시용 */
export function registeredSchools(
  record: AdmissionRecord
): AdmissionSchoolRecord[] {
  return record.admissionSchools.filter((s) => s.isRegist);
}

/** 목록 카드용 학교 라벨 */
export function schoolDisplayLines(
  record: AdmissionRecord
): { univ: string; dept: string; badge: "등록" | "합격" | "불합격" }[] {
  const regist = record.admissionSchools.filter((s) => s.isRegist);
  const source = regist.length > 0 ? regist : record.admissionSchools;
  return source.map((s) => {
    let badge: "등록" | "합격" | "불합격" = "불합격";
    if (s.isRegist) badge = "등록";
    else if (s.isAccept) badge = "합격";
    return { univ: s.univName, dept: s.deptName, badge };
  });
}
