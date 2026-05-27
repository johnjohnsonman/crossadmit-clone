import { createAdminClient } from "@/lib/supabase/admin";
import { categoryToSubcategory } from "@/lib/pipeline/study-korea/categories";
import { postPath } from "@/lib/forum/reddit-categories";
import { mapSubmitCategory } from "@/lib/posts/submit-anonymous";
import { generateSlug } from "@/lib/utils/slug";

export type UpdatePostInput = {
  title?: string;
  body?: string;
  category?: string;
  nickname?: string;
};

const AI_FIELDS_NULL = {
  ai_summary: null,
  ai_summary_kr: null,
  ai_title_en: null,
  ai_summary_en: null,
  ai_content_en: null,
  ai_content_kr: null,
};

export async function updateStudyKoreaPost(
  postId: string,
  input: UpdatePostInput
): Promise<
  | { success: true; redirect: string; category: string; slug: string }
  | { success: false; reason: string; status: number }
> {
  const supabase = createAdminClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("study_korea_posts")
    .select("id,title,content,category,slug,anonymous_nickname,author")
    .eq("id", postId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { success: false, reason: "Post not found", status: 404 };
  }

  const updates: Record<string, unknown> = {
    ...AI_FIELDS_NULL,
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    const t = input.title.trim();
    if (t.length < 5) {
      return { success: false, reason: "Title must be at least 5 characters.", status: 400 };
    }
    updates.title = t;
  }

  if (input.body !== undefined) {
    const c = input.body.trim();
    if (c.length < 30) {
      return { success: false, reason: "Content must be at least 30 characters.", status: 400 };
    }
    updates.content = c;
  }

  let category = existing.category as string;
  if (input.category !== undefined) {
    category = mapSubmitCategory(input.category);
    updates.category = category;
    updates.subcategory = categoryToSubcategory(category);
  }

  if (input.nickname !== undefined) {
    const nick = (input.nickname.trim() || "Anonymous").slice(0, 40);
    updates.anonymous_nickname = nick;
    updates.author = nick;
  }

  const { error: upErr } = await supabase
    .from("study_korea_posts")
    .update(updates)
    .eq("id", postId);

  if (upErr) {
    return { success: false, reason: upErr.message, status: 500 };
  }

  const titleForSlug =
    (updates.title as string | undefined) ?? (existing.title as string);
  const slug = generateSlug(titleForSlug, postId);
  const path = postPath(category, slug);

  await supabase
    .from("study_korea_posts")
    .update({ slug, url: path })
    .eq("id", postId);

  return { success: true, redirect: path, category, slug };
}

export async function softDeleteStudyKoreaPost(
  postId: string
): Promise<{ success: true } | { success: false; reason: string; status: number }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("study_korea_posts")
    .update({
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    return { success: false, reason: error.message, status: 500 };
  }
  return { success: true };
}

/** Safe columns for edit prefill — never password fields */
export const POST_EDIT_SELECT =
  "id,title,content,category,subcategory,university,university_id,anonymous_nickname,author,slug,language,post_type,source";
