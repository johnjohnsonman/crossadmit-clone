import { createHash } from "crypto";
import type { NextRequest } from "next/server";

const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|facebookexternalhit|bingpreview|headless/i;

export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent?.trim()) return true;
  return BOT_UA_PATTERN.test(userAgent);
}

export function buildVisitorHash(
  request: NextRequest,
  userAgentHeader?: string | null
): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  const userAgent = userAgentHeader ?? request.headers.get("user-agent") ?? "";
  const salt = process.env.VIEW_HASH_SALT || "crossadmit";

  return createHash("sha256")
    .update(`${ip}_${userAgent}_${salt}`)
    .digest("hex")
    .substring(0, 32);
}
