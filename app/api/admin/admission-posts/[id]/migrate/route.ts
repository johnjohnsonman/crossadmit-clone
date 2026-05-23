import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import {
  extractFromStudyKoreaPost,
  loadStudyKoreaPost,
} from "@/lib/admissions/load-post-extract";
import {
  migrateErrorPayload,
  MigrateStepError,
} from "@/lib/admissions/migrate-step-error";
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
  try {
    if (!verifyAdminSecret(request)) {
      return NextResponse.json(
        { error: "Unauthorized", step: "auth" },
        { status: 401 }
      );
    }

    const { id: postId } = await params;
    console.log("[MIGRATE] start postId:", postId);

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      throw new MigrateStepError(
        "unknown",
        e instanceof Error ? e.message : "Supabase admin client failed",
        e
      );
    }

    console.log("[MIGRATE] load_post");
    const post = await loadStudyKoreaPost(supabase, postId);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found", step: "load_post" },
        { status: 404 }
      );
    }

    let overrides: Partial<ExtractedAdmission> | undefined;
    try {
      const body = (await request.json()) as {
        overrides?: Partial<ExtractedAdmission>;
      };
      overrides = body.overrides;
      console.log("[MIGRATE] parse_body:", overrides ? "with overrides" : "empty");
    } catch {
      console.log("[MIGRATE] parse_body: empty body (AI extract)");
    }

    let extracted: ExtractedAdmission;
    if (overrides && Object.keys(overrides).length > 0) {
      console.log("[MIGRATE] normalize overrides");
      extracted = normalizeExtractedOverrides(overrides);
    } else {
      console.log("[MIGRATE] claude_extract");
      extracted = await extractFromStudyKoreaPost(supabase, post);
    }

    console.log("[MIGRATE] migrate_to_admissions");
    const result = await migrateStudyKoreaPostToAdmission(
      supabase,
      postId,
      post,
      extracted
    );

    if (!result.success) {
      console.log("[MIGRATE] business failure:", result.step, result.error);
      return NextResponse.json(
        {
          error: result.error,
          step: result.step,
          extracted: result.extracted,
          suggest_forum: result.suggest_forum ?? false,
        },
        { status: result.status }
      );
    }

    console.log("[MIGRATE] success admission_id:", result.admission_id);
    return NextResponse.json({
      success: true,
      admission_id: result.admission_id,
      schools_count: result.schools_count,
      source_url: result.source_url,
      confidence: extracted.confidence,
      step: "done",
    });
  } catch (error) {
    console.error("[MIGRATE]", error);
    if (error instanceof Error && error.stack) {
      console.error("[MIGRATE] Stack:", error.stack);
    }

    const payload = migrateErrorPayload(error);
    return NextResponse.json(payload, { status: 500 });
  }
}
