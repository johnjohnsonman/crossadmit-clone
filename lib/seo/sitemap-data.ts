import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePostCategory, postPath } from "@/lib/forum/reddit-categories";

export async function getSitemapPosts(limit = 2000) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("study_korea_posts")
    .select("slug, category, subcategory, created_at, ai_last_updated")
    .eq("is_published", true)
    .or("moderation_status.in.(approved,auto_approved),moderation_status.is.null")
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[sitemap] posts:", error.message);
    return [];
  }

  return (data ?? []).map((p) => {
    const cat = normalizePostCategory(p.category, p.subcategory);
    const last =
      (p as { ai_last_updated?: string | null }).ai_last_updated ?? p.created_at;
    return {
      path: postPath(cat, p.slug as string),
      lastModified: new Date(last),
    };
  });
}

export async function getSitemapMentors(limit = 500) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mentors")
    .select("id, updated_at, created_at")
    .eq("is_active", true)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[sitemap] mentors:", error.message);
    return [];
  }

  return (data ?? []).map((m) => ({
    id: m.id as string,
    lastModified: new Date(
      (m.updated_at as string) || (m.created_at as string) || Date.now()
    ),
  }));
}
