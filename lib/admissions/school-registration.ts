export type SchoolResultStatus = "합격" | "등록" | "불합격";

export type SchoolWithStatus = { status: SchoolResultStatus };

export function countAcceptedSchools(schools: SchoolWithStatus[]): number {
  return schools.filter((s) => s.status === "합격" || s.status === "등록").length;
}

export function countRegisteredSchools(schools: SchoolWithStatus[]): number {
  return schools.filter((s) => s.status === "등록").length;
}

/** 합격 2곳 이상일 때 등록 학교 정확히 1곳 필수 */
export function validateRegisteredSchool(
  schools: SchoolWithStatus[]
): { ok: true } | { ok: false; error: string } {
  const acceptedCount = countAcceptedSchools(schools);
  const registCount = countRegisteredSchools(schools);

  if (registCount > 1) {
    return { ok: false, error: "등록은 한 학교만 선택 가능합니다" };
  }
  if (acceptedCount >= 2 && registCount === 0) {
    return {
      ok: false,
      error: "여러 학교에 합격하셨네요! 어디에 등록하셨는지 선택해주세요",
    };
  }
  return { ok: true };
}
