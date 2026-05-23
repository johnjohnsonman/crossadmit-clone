import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import {
  normalizeUnivId,
  resolveDepartmentId,
} from "@/lib/admissions/resolve-school-ids";
import { extractAdmissionFromPost } from "@/lib/pipeline/study-korea/extract-admission-review";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toFkId(id: number | null | undefined): number | null {
  if (id == null || id <= 0) return null;
  return id;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const supabase = createAdminClient();

  const { data: post, error: postErr } = await supabase
    .from("study_korea_posts")
    .select("id, title, content, url")
    .eq("id", postId)
    .single();

  if (postErr || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { data: universities, error: univErr } = await supabase
    .from("universities")
    .select("id, name_kr, name_en")
    .eq("is_active", true);

  if (univErr) {
    return NextResponse.json({ error: univErr.message }, { status: 500 });
  }

  let extracted;
  try {
    extracted = await extractAdmissionFromPost(
      post.title ?? "",
      post.content ?? "",
      (universities ?? []) as {
        id: number;
        name_kr: string;
        name_en: string | null;
      }[]
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (extracted.confidence === "low") {
    return NextResponse.json(
      {
        error: "합격 정보 추출 신뢰도 낮음. 수동 검토 권장.",
        extracted,
      },
      { status: 400 }
    );
  }

  const year =
    extracted.year > 1990 && extracted.year <= new Date().getFullYear() + 1
      ? extracted.year
      : new Date().getFullYear() - 1;

  const primary =
    extracted.schools.find((s) => s.is_regist) ??
    extracted.schools.find((s) => s.is_accept) ??
    extracted.schools[0];

  const autoTitle = `${primary.univ_name} ${primary.dept_name} · ${year}년 합격 후기`;

  const { data: admission, error: aError } = await supabase
    .from("admissions")
    .insert({
      original_user_id: 0,
      user_handle: extracted.nickname || "익명",
      year,
      year_end: year,
      title: autoTitle,
      view_count: 0,
      likes_count: 0,
      is_verified: false,
      is_featured: false,
      published: true,
      source: "auto_collected",
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (aError || !admission) {
    return NextResponse.json(
      { error: aError?.message ?? "admissions insert failed" },
      { status: 500 }
    );
  }

  const admissionId = admission.id as number;
  const reviewText = extracted.review || post.content || "";

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
      univ_name: school.univ_name,
      dept_name: school.dept_name,
      is_apply: true,
      is_accept: school.is_accept,
      is_regist: school.is_regist,
      is_grad: false,
      admission_type: extracted.admission_type || "기타",
      review: reviewText,
      thumbnail: "",
    });
  }

  const { error: schoolErr } = await supabase
    .from("admission_schools")
    .insert(schoolRows);

  if (schoolErr) {
    await supabase.from("admissions").delete().eq("id", admissionId);
    return NextResponse.json({ error: schoolErr.message }, { status: 500 });
  }

  await supabase
    .from("study_korea_posts")
    .update({
      is_admission_post: false,
      moderation_status: "migrated",
    })
    .eq("id", postId);

  return NextResponse.json({
    success: true,
    admission_id: admissionId,
    schools_count: schoolRows.length,
    source_url: post.url,
  });
}
