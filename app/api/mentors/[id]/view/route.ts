import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildVisitorHash, isBotUserAgent } from "@/lib/mentors/view-track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: mentorId } = await context.params;
    if (!mentorId?.trim()) {
      return NextResponse.json(
        { incremented: false, error: "Invalid mentor id" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent");
    if (isBotUserAgent(userAgent)) {
      return NextResponse.json({ incremented: false, reason: "bot" });
    }

    const visitorHash = buildVisitorHash(request, userAgent);
    const supabase = createAdminClient();

    const { data: incremented, error } = await supabase.rpc(
      "increment_mentor_view",
      {
        p_mentor_id: mentorId,
        p_visitor_hash: visitorHash,
      }
    );

    if (error) {
      console.error("[mentor view]", error);
      return NextResponse.json(
        { incremented: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ incremented: Boolean(incremented) });
  } catch (e) {
    console.error("[mentor view]", e);
    return NextResponse.json(
      {
        incremented: false,
        error: e instanceof Error ? e.message : "Server error",
      },
      { status: 500 }
    );
  }
}
