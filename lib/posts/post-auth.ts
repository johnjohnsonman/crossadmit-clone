import type { NextRequest } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/verify";
import { verifyAnonymousPassword } from "@/lib/security/hash";
import { verifyEditToken } from "@/lib/posts/edit-token";
import {
  getPostPasswordHash,
  postHasPassword,
  type PostPasswordRow,
} from "@/lib/posts/post-password";

export type PostAuthRow = PostPasswordRow & {
  id: string;
  is_published?: boolean | null;
};

export function canAuthorizePost(
  post: PostAuthRow,
  request: NextRequest,
  password?: string,
  editToken?: string
): { ok: true; via: "admin" | "password" | "token" } | { ok: false; reason: string; status: number } {
  if (verifyAdminAccess(request)) {
    return { ok: true, via: "admin" };
  }

  if (editToken?.trim()) {
    const check = verifyEditToken(editToken.trim(), post.id);
    if (check.valid) return { ok: true, via: "token" };
    return { ok: false, reason: check.reason || "Invalid token", status: 401 };
  }

  const stored = getPostPasswordHash(post);
  if (!stored) {
    return {
      ok: false,
      reason: "This post has no edit password. Only an admin can modify it.",
      status: 403,
    };
  }

  if (!password || !/^\d{4}$/.test(password)) {
    return { ok: false, reason: "4-digit password required", status: 400 };
  }

  if (!verifyAnonymousPassword(password, stored)) {
    return { ok: false, reason: "Wrong password", status: 401 };
  }

  return { ok: true, via: "password" };
}

export { postHasPassword, getPostPasswordHash };
