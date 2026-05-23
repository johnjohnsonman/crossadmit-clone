import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import {
  getGuideQueueStatus,
  translateGuidePost,
} from "@/lib/ai-guides/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function jsonError(error: unknown, status = 500) {
  console.error("[ai-guide translate]", error);
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined,
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as { post_id?: string };
    const postId = body.post_id?.trim();
    if (!postId) {
      return NextResponse.json(
        { success: false, error: "post_id is required" },
        { status: 400 }
      );
    }

    const result = await translateGuidePost(postId);
    const status = await getGuideQueueStatus();
    return NextResponse.json({ ...status, ...result });
  } catch (e) {
    return jsonError(e);
  }
}
