import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { addGuideTopic } from "@/lib/ai-guides/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      topic_title?: string;
      category?: string;
      keywords?: string;
      priority?: number;
      reference_urls?: string;
    };

    const topic_title = body.topic_title?.trim();
    const category = body.category?.trim();
    if (!topic_title || !category) {
      return NextResponse.json(
        { error: "topic_title and category are required" },
        { status: 400 }
      );
    }

    const keywords =
      typeof body.keywords === "string"
        ? body.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

    const priority = Math.min(
      10,
      Math.max(1, Number(body.priority) || 5)
    );

    const reference_urls =
      typeof body.reference_urls === "string" && body.reference_urls.trim()
        ? body.reference_urls
            .split(/[\n,]+/)
            .map((u) => u.trim())
            .filter(Boolean)
        : [];

    const topic = await addGuideTopic({
      topic_title,
      category,
      keywords,
      priority,
      reference_urls,
    });

    return NextResponse.json({ ok: true, topic });
  } catch (e) {
    console.error("[admin ai-guides topics POST]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
