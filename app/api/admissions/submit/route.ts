import { NextRequest, NextResponse } from "next/server";
import { isAdmitTrack } from "@/lib/admissions/admit-track";
import { buildIntlTitle } from "@/lib/admissions/intl-submission";
import {
  normalizeUnivId,
  resolveDepartmentId,
} from "@/lib/admissions/resolve-school-ids";
import { validateRegisteredSchool } from "@/lib/admissions/school-registration";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdmissionSchoolInsert,
  AdmissionsInsert,
  CrossComparisonInsert,
} from "@/lib/supabase/types";

export const runtime = "nodejs";

export type SchoolSubmitPayload = {
  univ_id?: number | null;
  dept_id?: number | null;
  univ_name: string;
  dept_name: string;
  status: "합격" | "등록" | "불합격";
  admission_type?: string;
};

function statusToFlags(status: SchoolSubmitPayload["status"]) {
  if (status === "등록") {
    return { is_apply: true, is_accept: true, is_regist: true };
  }
  if (status === "합격") {
    return { is_apply: true, is_accept: true, is_regist: false };
  }
  return { is_apply: true, is_accept: false, is_regist: false };
}

function toFkId(id: number | null | undefined): number | null {
  return id != null && id > 0 ? id : null;
}

function isSchool(x: unknown): x is SchoolSubmitPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const st = String(o.status ?? "");
  return (
    typeof o.univ_name === "string" &&
    typeof o.dept_name === "string" &&
    o.univ_name.trim().length > 0 &&
    o.dept_name.trim().length > 0 &&
    ["합격", "등록", "불합격"].includes(st)
  );
}

async function persistAdmission(
  admin: ReturnType<typeof createAdminClient>,
  admissionRow: AdmissionsInsert,
  schools: SchoolSubmitPayload[],
  admission_type: string,
  review: string
) {
  const { data: inserted, error: insErr } = await admin
    .from("admissions")
    .insert(admissionRow)
    .select("id")
    .single();

  if (insErr || !inserted) {
    console.error("[admissions/submit]", insErr);
    return {
      ok: false as const,
      error: insErr?.message?.includes("admit_track")
        ? "Database migration required: run 022_admit_track.sql in Supabase."
        : "저장에 실패했습니다.",
    };
  }

  const admissionId = inserted.id as number;
  const schoolRows: AdmissionSchoolInsert[] = [];
  const resolvedSchools: SchoolSubmitPayload[] = [];

  for (const s of schools) {
    const clientUnivId =
      typeof s.univ_id === "number" && s.univ_id > 0 ? s.univ_id : undefined;
    const clientDeptId =
      typeof s.dept_id === "number" && s.dept_id > 0 ? s.dept_id : undefined;
    const univId = await normalizeUnivId(admin, clientUnivId);
    const deptId = await resolveDepartmentId(
      admin,
      univId,
      s.dept_name,
      clientDeptId
    );
    const flags = statusToFlags(s.status);
    resolvedSchools.push({ ...s, univ_id: univId, dept_id: deptId });
    schoolRows.push({
      admission_id: admissionId,
      univ_id: toFkId(univId),
      dept_id: toFkId(deptId),
      univ_name: s.univ_name,
      dept_name: s.dept_name,
      is_apply: flags.is_apply,
      is_accept: flags.is_accept,
      is_regist: flags.is_regist,
      is_grad: false,
      admission_type: s.admission_type || admission_type,
      review: review || "",
      thumbnail: "",
    });
  }

  const { error: schoolErr } = await admin
    .from("admission_schools")
    .insert(schoolRows);

  if (schoolErr) {
    console.error("[admission_schools]", schoolErr);
    await admin.from("admissions").delete().eq("id", admissionId);
    return { ok: false as const, error: "학교 정보 저장에 실패했습니다." };
  }

  const accepted = resolvedSchools.filter(
    (s) => s.status === "합격" || s.status === "등록"
  );

  const crossRows: CrossComparisonInsert[] = [];
  for (let i = 0; i < accepted.length; i++) {
    for (let j = i + 1; j < accepted.length; j++) {
      const a = accepted[i];
      const b = accepted[j];
      const aUniv = toFkId(a.univ_id);
      const bUniv = toFkId(b.univ_id);
      if (!aUniv || !bUniv || aUniv === bUniv) continue;

      const aReg = a.status === "등록";
      const bReg = b.status === "등록";
      if (aReg && !bReg) {
        crossRows.push({
          admission_id: admissionId,
          univ_id_win: aUniv,
          univ_id_lose: bUniv,
          univ_name_win: a.univ_name,
          univ_name_lose: b.univ_name,
          dept_name_win: a.dept_name,
          dept_name_lose: b.dept_name,
        });
      } else if (bReg && !aReg) {
        crossRows.push({
          admission_id: admissionId,
          univ_id_win: bUniv,
          univ_id_lose: aUniv,
          univ_name_win: b.univ_name,
          univ_name_lose: a.univ_name,
          dept_name_win: b.dept_name,
          dept_name_lose: a.dept_name,
        });
      }
    }
  }

  if (crossRows.length > 0) {
    const { error: crossErr } = await admin
      .from("cross_comparisons")
      .insert(crossRows);
    if (crossErr) {
      console.error("[cross_comparisons]", crossErr);
    }
  }

  return { ok: true as const, id: admissionId };
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

    if (body.form === "intl") {
      const rawSchools = body.schools;
      const schools: SchoolSubmitPayload[] = Array.isArray(rawSchools)
        ? rawSchools.filter(isSchool).map((s) => ({
            univ_id:
              typeof s.univ_id === "number" && s.univ_id > 0
                ? s.univ_id
                : undefined,
            univ_name: String(s.univ_name).trim(),
            dept_name: String(s.dept_name).trim() || "General",
            status: s.status,
            admission_type: "International",
          }))
        : [];

      const year = parseInt(String(body.year ?? ""), 10);
      const maxYear = new Date().getFullYear();
      if (schools.length === 0) {
        return NextResponse.json(
          { success: false, error: "Add at least one university." },
          { status: 400 }
        );
      }
      if (Number.isNaN(year) || year < 2000 || year > maxYear) {
        return NextResponse.json(
          { success: false, error: "Invalid admission year." },
          { status: 400 }
        );
      }

      const registValidation = validateRegisteredSchool(schools);
      if (!registValidation.ok) {
        return NextResponse.json(
          { success: false, error: registValidation.error },
          { status: 400 }
        );
      }

      const admitTrackRaw = String(body.admit_track ?? "international").trim();
      const admit_track = isAdmitTrack(admitTrackRaw)
        ? admitTrackRaw
        : "international";

      const registered = schools.filter((s) => s.status === "등록");
      const primary = registered[0] ?? schools.find((s) => s.status === "합격") ?? schools[0];
      const trackForTitle =
        admit_track === "gks"
          ? "gks"
          : admit_track === "overseas_kr"
            ? "overseas_kr"
            : "international";
      const autoTitle = buildIntlTitle(
        year,
        primary.univ_name,
        trackForTitle
      );

      const nickname = String(body.nickname ?? "").trim();
      const isVerified = Boolean(body.is_verified);

      const admissionRow: AdmissionsInsert = {
        original_user_id: 0,
        user_handle: nickname || "Anonymous",
        year,
        year_end: year,
        title: autoTitle,
        input_score: String(body.input_score ?? "").trim(),
        input_gpa: String(body.input_gpa ?? "").trim(),
        input_specialty: String(body.input_specialty ?? "").trim(),
        view_count: 0,
        likes_count: 0,
        is_verified: isVerified,
        is_featured: false,
        published: true,
        source: "crossadmit_intl_form",
        admit_track,
        source_type: "user_submitted_intl",
        source_url: String(body.verification_url ?? "").trim() || undefined,
        created_at: new Date().toISOString(),
      };

      const admin = createAdminClient();
      const result = await persistAdmission(
        admin,
        admissionRow,
        schools,
        "International",
        ""
      );
      if (!result.ok) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Your story has been published!",
        id: result.id,
      });
    }

    const rawSchools = body.schools ?? body.schools_applied;
    const schools: SchoolSubmitPayload[] = Array.isArray(rawSchools)
      ? rawSchools.filter(isSchool).map((s) => ({
          univ_id:
            typeof s.univ_id === "number" && s.univ_id > 0 ? s.univ_id : undefined,
          dept_id:
            typeof s.dept_id === "number" && s.dept_id > 0 ? s.dept_id : undefined,
          univ_name: String(s.univ_name).trim(),
          dept_name: String(s.dept_name).trim(),
          status: s.status,
          admission_type: String(s.admission_type ?? body.admission_type ?? "").trim(),
        }))
      : [];

    const yearRaw = body.year;
    const admission_type = String(body.admission_type ?? "").trim();
    const nickname = String(body.nickname ?? body.user_handle ?? "").trim();
    const review = String(body.review ?? "").trim();
    const title = String(body.title ?? "").trim();
    const input_score = String(body.input_score ?? body.csat_total ?? "").trim();
    const input_gpa = String(body.input_gpa ?? body.gpa_grade ?? "").trim();
    const input_specialty = String(body.input_specialty ?? "").trim();

    const year =
      typeof yearRaw === "number"
        ? yearRaw
        : parseInt(String(yearRaw ?? ""), 10);

    const errors: string[] = [];
    if (schools.length === 0) errors.push("지원 학교를 1개 이상 입력해주세요.");
    const maxYear = new Date().getFullYear();
    if (Number.isNaN(year) || year < 2000 || year > maxYear) {
      errors.push(`입학 연도는 2000년~${maxYear}년 사이로 선택해주세요.`);
    }
    if (!admission_type) errors.push("전형 종류를 선택해주세요.");

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0] },
        { status: 400 }
      );
    }

    const registValidation = validateRegisteredSchool(schools);
    if (!registValidation.ok) {
      return NextResponse.json(
        { success: false, error: registValidation.error },
        { status: 400 }
      );
    }

    const registered = schools.filter((s) => s.status === "등록");
    const primary = registered[0] ?? schools[0];
    const autoTitle =
      title ||
      `${primary.univ_name} ${primary.dept_name} · ${year}년 합격 후기`;

    const admissionRow: AdmissionsInsert = {
      original_user_id: 0,
      user_handle: nickname || "익명",
      year,
      year_end: year,
      title: autoTitle,
      input_score,
      input_gpa,
      input_specialty,
      view_count: 0,
      likes_count: 0,
      is_verified: false,
      is_featured: false,
      published: true,
      source: "user_submission",
      admit_track: isAdmitTrack(String(body.admit_track ?? ""))
        ? String(body.admit_track)
        : "regular_kr",
      source_type: "user_submitted",
      created_at: new Date().toISOString(),
    };

    const admin = createAdminClient();
    const krResult = await persistAdmission(
      admin,
      admissionRow,
      schools,
      admission_type,
      review
    );
    if (!krResult.ok) {
      return NextResponse.json(
        { success: false, error: krResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "후기가 등록되었습니다!",
      id: krResult.id,
    });
  } catch (e) {
    console.error("[admissions/submit]", e);
    return NextResponse.json(
      { success: false, error: "오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
