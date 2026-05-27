import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { setAdminCookieOnResponse } from "@/lib/admin/admin-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redirectTo =
    request.nextUrl.searchParams.get("redirect")?.trim() || "/forum";
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/forum";

  const url = new URL(safeRedirect, request.url);
  const response = NextResponse.redirect(url);
  setAdminCookieOnResponse(response);
  return response;
}
