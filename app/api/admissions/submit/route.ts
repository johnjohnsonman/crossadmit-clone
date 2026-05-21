import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCrossComparisonsFromSchools } from "@/lib/supabase/admissions-service";

export const runtime = "nodejs";

type SchoolPayload = {
  univ_id: number
  dept_id: number
  univ_name: string
  dept_name: string
  is_apply: boolean
  is_accept: boolean
  is_regist: boolean
  admission_type: string
  review?: string
}

function parseSchool(x: unknown): SchoolPayload | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const univ_id = Number(o.univ_id);
  const dept_id = Number(o.dept_id ?? 0);
  const univ_name = String(o.univ_name ?? "").trim();
  const dept_name = String(o.dept_name ?? "").trim();
  if (!univ_name || !dept_name) return null;
  return {
    univ_id: Number.isNaN(univ_id) ? 0 : univ_id,
    dept_id: Number.isNaN(dept_id) ? 0 : dept_id,
    univ_name,
    dept_name,
    is_apply: Boolean(o.is_apply),
    is_accept: Boolean(o.is_accept),
    is_regist: Boolean(o.is_regist),
    admission_type: String(o.admission_type ?? "").trim(),
    review: String(o.review ?? "").trim(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const schoolsRaw = body.schools;
    const schools: SchoolPayload[] = Array.isArray(schoolsRaw)
      ? schoolsRaw.map(parseSchool).filter((s): s is SchoolPayload => s !== null)
      : [];

    const year = parseInt(String(body.year ?? ""), 10);
    const user_handle = String(body.user_handle ?? body.nickname ?? "").trim() || "익명";
    const title = String(body.title ?? "").trim();
    const input_score = String(body.input_score ?? "").trim();
    const input_gpa = String(body.input_gpa ?? "").trim();
    const input_specialty = String(body.input_specialty ?? body.review ?? "").trim();

    if (schools.length === 0) {
      return NextResponse.json(
        { success: false, error: "지원 학교를 1개 이상 입력해주세요." },
        { status: 400 }
      );
    }
    if (Number.isNaN(year) || year < 1990 || year > 2035) {
      return NextResponse.json(
        { success: false, error: "입학 연도를 확인해주세요." },
        { status: 400 }
      );
    }

    const hasRegist = schools.some((s) => s.is_regist);
    if (!hasRegist) {
      return NextResponse.json(
        { success: false, error: "등록한 학교를 1개 선택해주세요." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: maxRow } = await admin
      .from("admissions")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextId = (maxRow?.id ?? 0) + 1;

    const { error: admErr } = await admin.from("admissions").insert({
      id: nextId,
      original_user_id: 0,
      user_handle,
      year,
      year_end: year,
      title: title || `${year}년 합격 정보`,
      input_score,
      input_gpa,
      input_specialty,
      view_count: 0,
      likes_count: 0,
      is_verified: false,
      is_featured: false,
      published: true,
      source: "user_submission",
      created_at: new Date().toISOString(),
    });

    if (admErr) {
      console.error("[submit] admission", admErr);
      return NextResponse.json(
        { success: false, error: "저장에 실패했습니다." },
        { status: 500 }
      );
    }

    let schoolId = 1;
    const { data: maxSchool } = await admin
      .from("admission_schools")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxSchool?.id) schoolId = maxSchool.id + 1;

    const schoolRows = schools.map((s, i) => ({
      id: schoolId + i,
      admission_id: nextId,
      univ_id: s.univ_id,
      dept_id: s.dept_id,
      univ_name: s.univ_name,
      dept_name: s.dept_name,
      is_apply: s.is_apply,
      is_accept: s.is_accept,
      is_regist: s.is_regist,
      is_grad: false,
      admission_type: s.admission_type,
      review: s.review ?? "",
      thumbnail: "",
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    const { error: schoolErr } = await admin
      .from("admission_schools")
      .insert(schoolRows);

    if (schoolErr) {
      console.error("[submit] schools", schoolErr);
      return NextResponse.json(
        { success: false, error: "학교 정보 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    const crossRows = buildCrossComparisonsFromSchools(nextId, schools);
    if (crossRows.length > 0) {
      let crossId = 1;
      const { data: maxCross } = await admin
        .from("cross_comparisons")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxCross?.id) crossId = maxCross.id + 1;

      const { error: crossErr } = await admin.from("cross_comparisons").insert(
        crossRows.map((r, i) => ({
          id: crossId + i,
          ...r,
          is_active: true,
          created_at: new Date().toISOString(),
        }))
      );
      if (crossErr) console.error("[submit] cross", crossErr);
    }

    return NextResponse.json({
      success: true,
      message: "등록되었습니다.",
      admission_id: nextId,
    });
  } catch (e) {
    console.error("[submit]", e);
    return NextResponse.json(
      { success: false, error: "오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
