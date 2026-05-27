import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookieOnResponse } from "@/lib/admin/admin-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const redirectTo =
    request.nextUrl.searchParams.get("redirect")?.trim() || "/forum";
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/forum";

  const url = new URL(safeRedirect, request.url);
  const response = NextResponse.redirect(url);
  clearAdminCookieOnResponse(response);
  return response;
}
