import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
type VoteValue = -1 | 0 | 1;

function clampNonNegative(n: number): number {
  return Math.max(0, n);
}

function isVoteValue(v: unknown): v is VoteValue {
  return v === -1 || v === 0 || v === 1;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      vote?: number;
      prev_vote?: number;
    };

    if (!isVoteValue(body.vote)) {
      return NextResponse.json(
        { success: false, reason: "vote must be 1, -1, or 0" },
        { status: 400 }
      );
    }

    const nextVote = body.vote;
    const prevVote: VoteValue = isVoteValue(body.prev_vote) ? body.prev_vote : 0;

    const supabase = createAdminClient();
    const { data: post, error: fetchErr } = await supabase
      .from("study_korea_posts")
      .select("id,is_published,upvotes_count,downvotes_count")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !post?.id || post.is_published === false) {
      return NextResponse.json(
        { success: false, reason: "Post not found" },
        { status: 404 }
      );
    }

    let up = Number(post.upvotes_count ?? 0);
    let down = Number(post.downvotes_count ?? 0);

    // remove previous local vote impact
    if (prevVote === 1) up = clampNonNegative(up - 1);
    if (prevVote === -1) down = clampNonNegative(down - 1);

    // apply next vote
    if (nextVote === 1) up += 1;
    if (nextVote === -1) down += 1;

    const { error: upErr } = await supabase
      .from("study_korea_posts")
      .update({ upvotes_count: up, downvotes_count: down })
      .eq("id", id);

    if (upErr) {
      return NextResponse.json(
        { success: false, reason: upErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      counts: { upvotes_count: up, downvotes_count: down },
      score: up - down,
    });
  } catch (e) {
    console.error("[posts/vote]", e);
    return NextResponse.json(
      { success: false, reason: "Server error" },
      { status: 500 }
    );
  }
}
