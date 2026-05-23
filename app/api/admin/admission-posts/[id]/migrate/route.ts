import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { extractFromStudyKoreaPost } from "@/lib/admissions/load-post-extract";
import { loadStudyKoreaPost } from "@/lib/admissions/load-post-extract";
import {
  migrateStudyKoreaPostToAdmission,
  normalizeExtractedOverrides,
} from "@/lib/admissions/migrate-admission-post";
import type { ExtractedAdmission } from "@/lib/pipeline/study-korea/extract-admission-review";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const supabase = createAdminClient();
  const post = await loadStudyKoreaPost(supabase, postId);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  let overrides: Partial<ExtractedAdmission> | undefined;
  try {
    const body = (await request.json()) as {
      overrides?: Partial<ExtractedAdmission>;
    };
    overrides = body.overrides;
  } catch {
    /* empty body: Claude extract */
  }

  let extracted;
  try {
    if (overrides && Object.keys(overrides).length > 0) {
      extracted = normalizeExtractedOverrides(overrides);
    } else {
      extracted = await extractFromStudyKoreaPost(supabase, post);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const result = await migrateStudyKoreaPostToAdmission(
    supabase,
    postId,
    post,
    extracted
  );

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        extracted: result.extracted,
      },
      { status: result.status }
    );
  }

  return NextResponse.json({
    success: true,
    admission_id: result.admission_id,
    schools_count: result.schools_count,
    source_url: result.source_url,
    confidence: extracted.confidence,
  });
}
