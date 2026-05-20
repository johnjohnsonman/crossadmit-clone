import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdmissionsInsert } from "@/lib/supabase/types";

export const runtime = "nodejs";

function splitNonEmptyLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseTopikGrade(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).trim();
  if (s === "none" || s === "없음") return null;
  const n = parseInt(s, 10);
  if (Number.isNaN(n) || n < 1 || n > 6) return null;
  return n;
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

    const university = String(body.university ?? "").trim();
    const major = String(body.major ?? "").trim();
    const yearRaw = body.year;
    const admission_type = String(body.admission_type ?? "").trim();
    const status = String(body.status ?? "").trim();
    const review = String(body.review ?? "").trim();
    const nickname = String(body.nickname ?? "").trim();
    const nationality = String(body.nationality ?? "").trim();
    const prosText = String(body.pros ?? "");
    const consText = String(body.cons ?? "");
    const tipsText = String(body.tips ?? "");

    const errors: string[] = [];
    if (!university) errors.push("대학교명을 입력해주세요.");
    if (!major) errors.push("학과를 입력해주세요.");
    if (!admission_type) errors.push("전형 종류를 선택해주세요.");
    if (!status) errors.push("결과를 선택해주세요.");
    if (review.length < 50) errors.push("후기는 최소 50자 이상 입력해주세요.");

    const year =
      typeof yearRaw === "number"
        ? yearRaw
        : parseInt(String(yearRaw ?? ""), 10);
    if (yearRaw === undefined || yearRaw === null || yearRaw === "") {
      errors.push("입학 연도를 선택해주세요.");
    } else if (Number.isNaN(year) || year < 1990 || year > 2030) {
      errors.push("입학 연도가 올바르지 않습니다.");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0] ?? "입력값을 확인해주세요." },
        { status: 400 }
      );
    }

    const student_handle = nickname || "익명";
    const topik_grade = parseTopikGrade(body.topik);
    const pros = splitNonEmptyLines(prosText);
    const cons = splitNonEmptyLines(consText);
    const tips = splitNonEmptyLines(tipsText);

    const row: AdmissionsInsert = {
      id: `user-sub-${randomUUID()}`,
      university,
      university_en: university,
      major,
      year,
      admission_type,
      status,
      created_at: new Date().toISOString(),
      source: "user_submission",
      nationality: nationality || null,
      username: student_handle,
      student_handle,
      test_scores: null,
      gpa: null,
      special_skills: null,
      review,
      summary: null,
      raw_content: null,
      likes: 0,
      comments: null,
      published: false,
      verified: false,
      pros: pros.length ? pros : null,
      cons: cons.length ? cons : null,
      tips: tips.length ? tips : null,
      visa_type: null,
      language_proficiency: null,
      topik_level: topik_grade != null ? String(topik_grade) : null,
      topik_grade,
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
