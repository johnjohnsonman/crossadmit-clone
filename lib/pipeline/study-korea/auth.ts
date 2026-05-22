import type { NextRequest } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";

export function verifyCronOrAdmin(request: NextRequest): boolean {
  if (verifyAdminSecret(request)) return true;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV !== "production";
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}
