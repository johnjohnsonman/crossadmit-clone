import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClassifierUsageStats } from "@/lib/classifiers/classifier-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const today = todayStartIso();

    const { data: queue, error: queueErr } = await admin
      .from("admissions")
      .select(
        "id, title, user_handle, year, admit_track, home_country, high_school_type, input_score, input_gpa, input_specialty, source, source_type, source_url, classifier_confidence, classifier_reasoning, raw_content, created_at"
      )
      .eq("needs_review", true)
      .eq("published", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (queueErr) {
      return NextResponse.json({ error: queueErr.message }, { status: 500 });
    }

    const { count: pendingCount } = await admin
      .from("admissions")
      .select("id", { count: "exact", head: true })
      .eq("needs_review", true)
      .eq("published", false);

    const { count: approvedToday } = await admin
      .from("admissions")
      .select("id", { count: "exact", head: true })
      .like("source_type", "scraped_%")
      .eq("published", true)
      .eq("needs_review", false)
      .gte("created_at", today);

    const { count: rejectedToday } = await admin
      .from("admissions")
      .select("id", { count: "exact", head: true })
      .like("source_type", "scraped_%")
      .eq("published", false)
      .eq("needs_review", false)
      .ilike("classifier_reasoning", "%admin_rejected%")
      .gte("created_at", today);

    const classifier = await getClassifierUsageStats();

    return NextResponse.json({
      queue: queue ?? [],
      stats: {
        pending: pendingCount ?? 0,
        approved_today: approvedToday ?? 0,
        rejected_today: rejectedToday ?? 0,
      },
      classifier,
    });
  } catch (e) {
    console.error("[admin admissions-scraped-review GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = String(body.action ?? "").trim();
  const id = parseInt(String(body.id ?? ""), 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "approve") {
    const patch: Record<string, unknown> = {
      needs_review: false,
      published: true,
    };
    if (body.admit_track) patch.admit_track = body.admit_track;
    if (body.title) patch.title = String(body.title).trim();
    if (body.user_handle) patch.user_handle = String(body.user_handle).trim();

    const { error } = await admin.from("admissions").update(patch).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    const { data: row } = await admin
      .from("admissions")
      .select("classifier_reasoning")
      .eq("id", id)
      .single();

    const prev = String(row?.classifier_reasoning ?? "");
    const stamp = `[admin_rejected ${new Date().toISOString()}]`;

    const { error } = await admin
      .from("admissions")
      .update({
        published: false,
        needs_review: false,
        classifier_reasoning: prev.includes("admin_rejected")
          ? prev
          : `${prev}\n${stamp}`.trim(),
      })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
