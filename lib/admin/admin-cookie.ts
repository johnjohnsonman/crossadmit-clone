import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "ca_forum_admin";

const COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60;

function cookieSecret(): string {
  const s = process.env.ADMIN_COOKIE_SECRET?.trim() || process.env.ADMIN_SECRET?.trim();
  if (!s) throw new Error("ADMIN_COOKIE_SECRET or ADMIN_SECRET required");
  return s;
}

function b64urlEncode(data: string): string {
  return Buffer.from(data, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(data: string): string {
  const pad = data.length % 4 === 0 ? "" : "=".repeat(4 - (data.length % 4));
  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/") + pad,
    "base64"
  ).toString("utf8");
}

export function createAdminCookieValue(): string {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SEC;
  const payload = b64urlEncode(JSON.stringify({ role: "forum_admin", exp, v: 1 }));
  const sig = createHmac("sha256", cookieSecret())
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${payload}.${sig}`;
}

export function verifyAdminCookieValue(token: string | undefined | null): boolean {
  if (!token?.trim()) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  const expected = createHmac("sha256", cookieSecret())
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  try {
    const parsed = JSON.parse(b64urlDecode(payload)) as {
      role?: string;
      exp?: number;
    };
    if (parsed.role !== "forum_admin") return false;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function verifyAdminCookie(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminCookieValue(token);
}

export function setAdminCookieOnResponse(response: NextResponse): void {
  const value = createAdminCookieValue();
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ADMIN_COOKIE_NAME, value, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
}

export function clearAdminCookieOnResponse(response: NextResponse): void {
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
