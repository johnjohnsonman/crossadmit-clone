import type { NextRequest } from "next/server";

/** 쿼리 ?key= 또는 헤더 x-admin-secret */
export function verifyAdminSecret(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  const q = request.nextUrl.searchParams.get("key");
  const header = request.headers.get("x-admin-secret");
  return secret === q || secret === header;
}
