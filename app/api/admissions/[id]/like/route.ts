import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { incrementAdmissionLike } from "@/lib/supabase/admissions-service";

export const runtime = "nodejs";

const COOKIE_MAX_AGE = 60 * 60 * 24;

function cookieNameForAdmission(id: number): string {
  const h = createHash("sha256").update(String(id), "utf8").digest("hex").slice(0, 28);
  return `adliked_${h}`;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const cname = cookieNameForAdmission(id);
    const existing = cookieStore.get(cname);

    if (existing?.value === "1") {
      return NextResponse.json({ likes_count: null, already_liked: true });
    }

    const newCount = await incrementAdmissionLike(id);
    if (newCount === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
