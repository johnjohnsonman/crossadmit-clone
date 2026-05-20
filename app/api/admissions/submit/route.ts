import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdmissionsInsert, Json } from "@/lib/supabase/types";

export const runtime = "nodejs";

export type SchoolAppliedPayload = {
  university: string;
  university_en: string;
  major: string;
  status: string;
};

function parseTopikGrade(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).trim();
  if (s === "none" || s === "없음") return null;
  const n = parseInt(s, 10);
  if (Number.isNaN(n) || n < 1 || n > 6) return null;
  return n;
}

function isSchoolApplied(x: unknown): x is SchoolAppliedPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const st = String(o.status ?? "");
  return (
    typeof o.university === "string" &&
    typeof o.university_en === "string" &&
    typeof o.major === "string" &&
    o.university.trim().length > 0 &&
    o.major.trim().length > 0 &&
    ["합격", "등록", "불합격"].includes(st)
  );
}

function pickPrimarySchool(
  schools: SchoolAppliedPayload[]
): SchoolAppliedPayload {
  const registered = schools.find((s) => s.status === "등록");
  return registered ?? schools[0];
}

function buildTestScoresJson(body: Record<string, unknown>): Json | null {
  const csat_total = String(body.csat_total ?? "").trim();
  const csat_korean = String(body.csat_korean ?? "").trim();
  const csat_math = String(body.csat_math ?? "").trim();
  const csat_english = String(body.csat_english ?? "").trim();
  const csat_inquiry = String(body.csat_inquiry ?? "").trim();
  const sat_act = String(body.sat_act ?? "").trim();
  const english_test = String(body.english_test ?? "").trim();

  const csat: Record<string, string> = {};
  if (csat_korean) csat.korean = csat_korean;
  if (csat_math) csat.math = csat_math;
  if (csat_english) csat.english = csat_english;
  if (csat_inquiry) csat.inquiry = csat_inquiry;

  const obj: Record<string, unknown> = {};
  if (csat_total) obj.csat_total_or_percentile = csat_total;
  if (Object.keys(csat).length) obj.csat = csat;
  if (sat_act) obj.sat_act = sat_act;
  if (english_test) obj.english_proficiency = english_test;

  if (Object.keys(obj).length === 0) return null;
  return obj as Json;
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    const rawSchools = body.schools_applied;
    const schools: SchoolAppliedPayload[] = Array.isArray(rawSchools)
      ? rawSchools.filter(isSchoolApplied).map((s) => ({
          university: String(s.university).trim(),
          university_en: String(s.university_en).trim(),
          major: String(s.major).trim(),
          status: String(s.status).trim(),
        }))
      : [];

    const yearRaw = body.year;
    const admission_type = String(body.admission_type ?? "").trim();
    const nickname = String(body.nickname ?? "").trim();
    const nationality = String(body.nationality ?? "").trim();
    const review = String(body.review ?? "").trim();
    const gpa_grade = String(body.gpa_grade ?? "").trim();

    const year =
      typeof yearRaw === "number"
        ? yearRaw
        : parseInt(String(yearRaw ?? ""), 10);

    const errors: string[] = [];
    if (schools.length === 0) {
      errors.push("지원 학교를 1개 이상 입력해주세요.");
    }
    if (yearRaw === undefined || yearRaw === null || yearRaw === "") {
      errors.push("입학 연도를 선택해주세요.");
    } else if (Number.isNaN(year) || year < 1990 || year > 2030) {
      errors.push("입학 연도가 올바르지 않습니다.");
    }
    if (!admission_type) errors.push("전형 종류를 선택해주세요.");

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0] ?? "입력값을 확인해주세요." },
        { status: 400 }
      );
    }

    const primary = pickPrimarySchool(schools);
    const student_handle = nickname || "익명";
    const topik_grade = parseTopikGrade(body.topik);

    const gpaJson: Json | null = gpa_grade
      ? ({ unweighted: gpa_grade, label: "학생부 교과 등급" } as Json)
      : null;

    const testScores = buildTestScoresJson(body);

    const row: AdmissionsInsert = {
      id: `user-sub-${randomUUID()}`,
      university: primary.university,
      university_en: primary.university_en || primary.university,
      major: primary.major,
      year,
      admission_type,
      status: primary.status,
      created_at: new Date().toISOString(),
      source: "user_submission",
      nationality: nationality || null,
      username: student_handle,
      student_handle,
      test_scores: testScores,
      gpa: gpaJson,
      special_skills: null,
      review: review || null,
      summary: null,
      raw_content: null,
      likes: 0,
      comments: null,
      published: false,
      verified: false,
      pros: null,
      cons: null,
      tips: null,
      visa_type: null,
      language_proficiency: null,
      topik_level: topik_grade != null ? String(topik_grade) : null,
      topik_grade,
      schools_applied: schools as unknown as Json,
    };

    const supabase = createAdminClient();
    const { error } = await supabase.from("admissions").insert(row);

    if (error) {
      console.error("[admissions/submit]", error);
      return NextResponse.json(
        { success: false, error: "저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "등록되었습니다.",
    });
  } catch (e) {
    console.error("[admissions/submit]", e);
    if (e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        {
          success: false,
          error: "서버 설정 오류입니다. 관리자에게 문의해주세요.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: "오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
