import { createHash, randomUUID, timingSafeEqual } from "crypto";

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip.trim()).digest("hex");
}

export function hashAnonymousPassword(password: string): string {
  const salt = process.env.ANON_PASSWORD_SALT || "crossadmit-anon-v1";
  return createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
}

export function verifyAnonymousPassword(
  password: string,
  storedHash: string
): boolean {
  const computed = hashAnonymousPassword(password);
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(storedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function newAnonymousSourceId(): string {
  return `anon_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
