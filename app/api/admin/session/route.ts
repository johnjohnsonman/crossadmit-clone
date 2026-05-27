import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/admin/admin-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({ isAdmin: verifyAdminCookie(request) });
}
