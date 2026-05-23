import { classifyForumCategory } from "@/lib/admissions/classify-forum-category";
import {
  categoryToSubcategory,
  normalizeStudyKoreaCategory,
} from "@/lib/pipeline/study-korea/categories";
import { postPath } from "@/lib/forum/reddit-categories";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function moveStudyKoreaPostToForum(
  supabase: AdminClient,
  postId: string,
  options?: { category?: string }
): Promise<
  | { success: true; category: string; forum_url: string; slug: string }
  | { success: false; error: string }
> {
  const { data: post, error: fetchErr } = await supabase
    .from("study_korea_posts")
    .select("id, title, content, slug")
    .eq("id", postId)
    .single();

  if (fetchErr || !post) {
    return { success: false, error: "Post not found" };
  }

  const slug = String(post.slug ?? "").trim();
  if (!slug) {
    return { success: false, error: "slug 없음 — slug 백필 후 다시 시도" };
  }

  let category = options?.category?.trim().toLowerCase();
  if (!category) {
    category = await classifyForumCategory(
      post.title ?? "",
      post.content ?? ""
    );
  }
  const normalized = normalizeStudyKoreaCategory(category);
  const subcategory = categoryToSubcategory(normalized);

  const { error: updateErr } = await supabase
    .from("study_korea_posts")
    .update({
      category: normalized,
      subcategory,
      is_admission_post: false,
      is_published: true,
      moderation_status: "approved",
    })
    .eq("id", postId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  return {
    success: true,
    category: normalized,
    forum_url: postPath(normalized, slug),
    slug,
  };
}
