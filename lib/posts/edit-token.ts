import { createHmac, timingSafeEqual } from "crypto";

const EDIT_TOKEN_TTL_SEC = 300;

function secret(): string {
  const s =
    process.env.EDIT_TOKEN_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    process.env.ANON_PASSWORD_SALT?.trim();
  if (!s) throw new Error("EDIT_TOKEN_SECRET or ADMIN_SECRET required");
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

export function createEditToken(postId: string): string {
  const exp = Math.floor(Date.now() / 1000) + EDIT_TOKEN_TTL_SEC;
  const payload = b64urlEncode(JSON.stringify({ postId, exp, v: 1 }));
  const sig = createHmac("sha256", secret())
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${payload}.${sig}`;
}

export function verifyEditToken(
  token: string,
  postId: string
): { valid: boolean; reason?: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "Invalid token" };

  const [payload, sig] = parts;
  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: "Invalid token" };
    }
  } catch {
    return { valid: false, reason: "Invalid token" };
  }

  let parsed: { postId?: string; exp?: number };
  try {
    parsed = JSON.parse(b64urlDecode(payload)) as {
      postId?: string;
      exp?: number;
    };
  } catch {
    return { valid: false, reason: "Invalid token" };
  }

  if (parsed.postId !== postId) {
    return { valid: false, reason: "Token mismatch" };
  }
  if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
    return { valid: false, reason: "Token expired" };
  }

  return { valid: true };
}

export const EDIT_TOKEN_EXPIRES_SEC = EDIT_TOKEN_TTL_SEC;
