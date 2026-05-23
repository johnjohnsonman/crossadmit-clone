import type {
  ExtractedAdmission,
  ExtractedAdmissionSchool,
} from "@/lib/pipeline/study-korea/extract-admission-review";

/** Claude/수동 overrides 응답의 느슨한 school 객체 → 정규 행 */
export function parseSchoolFromRaw(
  raw: unknown
): ExtractedAdmissionSchool | null {
  if (!raw || typeof raw !== "object") return null;

  const o = raw as Record<string, unknown>;
  const univName = String(
    o.univ_name ??
      o.school_name ??
      o.university_name ??
      o.univName ??
      o.name ??
      ""
  ).trim();
  const deptName = String(
    o.dept_name ?? o.department ?? o.major ?? o.deptName ?? ""
  ).trim();

  if (!univName) return null;

  return {
    univ_id:
      typeof o.univ_id === "number" && o.univ_id > 0 ? o.univ_id : null,
    univ_name: univName,
    dept_name: deptName || "미상",
    is_accept: Boolean(o.is_accept),
    is_regist: Boolean(o.is_regist),
  };
}

/** schools 배열 정리 — undefined·빈 항목 제거, is_regist 1개만 */
export function sanitizeExtractedSchools(
  extracted: ExtractedAdmission
): ExtractedAdmission {
  const rawList = Array.isArray(extracted.schools) ? extracted.schools : [];

  let registSeen = false;
  const schools: ExtractedAdmissionSchool[] = [];

  for (const item of rawList) {
    const parsed = parseSchoolFromRaw(item);
    if (!parsed) continue;

    let is_regist = parsed.is_regist;
    if (is_regist) {
      if (registSeen) is_regist = false;
      else registSeen = true;
    }

    schools.push({ ...parsed, is_regist });
  }

  return { ...extracted, schools };
}
