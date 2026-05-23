import { createHash, randomUUID } from "crypto";

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
  return hashAnonymousPassword(password) === storedHash;
}

export function newAnonymousSourceId(): string {
  return `anon_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
