import type { NextRequest } from "next/server";
import { verifyAdminCookie } from "@/lib/admin/admin-cookie";

/** 쿼리 ?key= 또는 헤더 x-admin-secret */
export function verifyAdminSecret(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  const q = request.nextUrl.searchParams.get("key");
  const header = request.headers.get("x-admin-secret");
  return secret === q || secret === header;
}

/** httpOnly admin cookie (forum edit/delete bypass) */
export { verifyAdminCookie } from "@/lib/admin/admin-cookie";

export function verifyAdminAccess(request: NextRequest): boolean {
  return verifyAdminSecret(request) || verifyAdminCookie(request);
}
