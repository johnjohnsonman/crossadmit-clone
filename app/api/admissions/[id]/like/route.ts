import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const COOKIE_MAX_AGE = 60 * 60 * 24; /* 24h */

function cookieNameForAdmission(id: string): string {
  const h = createHash("sha256").update(id, "utf8").digest("hex").slice(0, 28);
  return `adliked_${h}`;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const cname = cookieNameForAdmission(id);
    const existing = cookieStore.get(cname);

    const admin = createAdminClient();

    const { data: row, error: selErr } = await admin
      .from("admissions")
      .select("likes_count")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();

    if (selErr || !row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const baseCount = typeof row.likes_count === "number" ? row.likes_count : 0;

    if (existing?.value === "1") {
      return NextResponse.json({
        likes_count: baseCount,
        already_liked: true,
      });
    }

    const newCount = baseCount + 1;
    const { error: upErr } = await admin
      .from("admissions")
      .update({
        likes_count: newCount,
        likes: newCount,
      })
      .eq("id", id);

    if (upErr) {
      console.error("[like]", upErr);
      return NextResponse.json(
        { error: "업데이트 실패" },
        { status: 500 }
      );
    }

    const res = NextResponse.json({
      likes_count: newCount,
      already_liked: false,
    });

    res.cookies.set(cname, "1", {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("[like]", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
