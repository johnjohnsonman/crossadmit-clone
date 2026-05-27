import { createAdminClient } from "@/lib/supabase/admin";
import { categoryToSubcategory } from "@/lib/pipeline/study-korea/categories";
import { normalizeStudyKoreaCategory } from "@/lib/pipeline/study-korea/categories";
import { postPath } from "@/lib/forum/reddit-categories";
import { generateSlug } from "@/lib/utils/slug";
import {
  hashAnonymousPassword,
  hashIp,
  newAnonymousSourceId,
} from "@/lib/security/hash";
import { moderateAnonymousPost } from "./moderate-anon";
import { translateAnonymousPost } from "./translate-anon";

export type SubmitAnonymousInput = {
  category: string;
  university?: string;
  university_id?: number | null;
  nickname?: string;
  password: string;
  title: string;
  content: string;
  language: "en" | "ko";
  autoTranslate?: boolean;
};

export type SubmitAnonymousResult =
  | { success: true; redirect: string; slug: string; category: string }
  | { success: false; reason: string; status: number };

const CATEGORY_MAP: Record<string, string> = {
  life: "living_cost",
  campus: "campus_life",
};

export function mapSubmitCategory(cat: string): string {
  const key = cat.toLowerCase().trim();
  return CATEGORY_MAP[key] ?? normalizeStudyKoreaCategory(key);
}

export async function submitAnonymousPost(
  input: SubmitAnonymousInput,
  ipHash: string
): Promise<SubmitAnonymousResult> {
  const category = mapSubmitCategory(input.category);
  const moderation = await moderateAnonymousPost(
    input.title,
    input.content,
    category
  );

  if (!moderation.approved) {
    return {
      success: false,
      reason: moderation.reason || "Post was not approved for this community.",
      status: 403,
    };
  }

  const finalCategory = mapSubmitCategory(moderation.category_confirmed);
  const translation = await translateAnonymousPost(
    input.title,
    input.content,
    input.language,
    input.autoTranslate !== false
  );

  const sourceId = newAnonymousSourceId();
  const supabase = createAdminClient();
  const nickname = (input.nickname?.trim() || "Anonymous").slice(0, 40);
  const passwordHash = hashAnonymousPassword(input.password);

  const row = {
    source: "user_anon",
    source_id: sourceId,
    post_type: "user_anon",
    title: input.title.trim(),
    content: input.content.trim(),
    url: "",
    author: nickname,
    anonymous_nickname: nickname,
    anonymous_password_hash: passwordHash,
    password_hash: passwordHash,
    author_ip_hash: ipHash,
    category: finalCategory,
    subcategory: categoryToSubcategory(finalCategory),
    university: input.university?.trim() || "",
    university_id: input.university_id ?? null,
    language: input.language,
    upvotes: 0,
    comment_count: 0,
    upvotes_count: 0,
    downvotes_count: 0,
    comments_count: 0,
    views_count: 0,
    ai_summary: translation.ai_summary_en,
    ai_summary_kr: translation.ai_summary_kr,
    ai_title_en: translation.ai_title_en,
    ai_summary_en: translation.ai_summary_en,
    ai_content_en: translation.ai_content_en,
    ai_tags: [],
    is_published: true,
    moderation_status: "auto_approved",
    source_created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("study_korea_posts")
    .insert(row)
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[submit-anon] insert failed:", error?.message);
    return {
      success: false,
      reason: error?.message || "Failed to save post",
      status: 500,
    };
  }

  const slug = generateSlug(translation.ai_title_en || input.title, data.id);
  const { error: slugErr } = await supabase
    .from("study_korea_posts")
    .update({ slug, url: postPath(finalCategory, slug) })
    .eq("id", data.id);

  if (slugErr) {
    console.error("[submit-anon] slug update failed:", slugErr.message);
  }

  const path = postPath(finalCategory, slug);
  return {
    success: true,
    redirect: path,
    slug,
    category: finalCategory,
  };
}

export function extractIpHash(request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return hashIp(ip);
}
