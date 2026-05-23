import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInactiveMentors, getTranslationBackfillStatus } from "@/lib/mentors/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const mentors = await getInactiveMentors();
    const stats = await getTranslationBackfillStatus();
    return NextResponse.json({ success: true, mentors, inactive: stats.inactive });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      id?: string;
      action?: "activate" | "hide";
    };
    if (!body.id || !body.action) {
      return NextResponse.json(
        { success: false, error: "id and action required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const patch =
      body.action === "activate"
        ? { is_active: true, is_verified: true, updated_at: new Date().toISOString() }
        : { is_active: false, is_verified: false, updated_at: new Date().toISOString() };

    const { error } = await admin.from("mentors").update(patch).eq("id", body.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
