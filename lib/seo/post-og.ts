import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePostCategory } from "@/lib/forum/reddit-categories";

export async function getPostTitleForOg(
  category: string,
  slug: string
): Promise<{ title: string; categoryLabel: string } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("study_korea_posts")
    .select("title, ai_title_en, category, subcategory")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;

  const cat = normalizePostCategory(data.category, data.subcategory);
  if (cat !== normalizePostCategory(category)) return null;

  const title =
    (data.ai_title_en as string | null)?.trim() ||
    (data.title as string) ||
    "Study in Korea";

  return { title: title.slice(0, 120), categoryLabel: `r/${cat}` };
}
