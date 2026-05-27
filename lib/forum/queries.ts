import { createClient } from "@/lib/supabase/server";
import {
  applyForumPostExclusions,
  isForumExcludedPost,
} from "./exclusions";
import { buildForumCategoryOrFilter } from "./category-filter";
import { normalizePostCategory } from "./reddit-categories";

export type StudyKoreaPostRow = {
  id: string;
  source: string;
  source_id: string;
  title: string;
  content?: string;
  url: string;
  author: string | null;
  category: string;
  subcategory: string | null;
  university: string | null;
  university_id: number | null;
  language: string | null;
  upvotes: number | null;
  comment_count: number | null;
  upvotes_count?: number | null;
  downvotes_count?: number | null;
  comments_count?: number | null;
  views_count?: number | null;
  slug: string | null;
  ai_summary: string | null;
  ai_summary_kr: string | null;
  ai_title_en: string | null;
  ai_summary_en: string | null;
  ai_content_en: string | null;
  ai_tags: string[] | null;
  source_created_at: string | null;
  created_at: string;
  is_published: boolean;
  post_type?: string | null;
  is_ai_generated?: boolean | null;
  ai_sources?: string[] | unknown | null;
  ai_last_updated?: string | null;
  ai_content_kr?: string | null;
  anonymous_nickname?: string | null;
};

const POST_SELECT =
  "id,source,source_id,title,content,url,author,category,subcategory,university,university_id,language,upvotes,comment_count,upvotes_count,downvotes_count,comments_count,views_count,slug,post_type,is_ai_generated,ai_sources,ai_last_updated,anonymous_nickname,ai_summary,ai_summary_kr,ai_title_en,ai_summary_en,ai_content_en,ai_content_kr,ai_tags,source_created_at,created_at,is_published";

export async function getPostBySlug(
  category: string,
  slug: string
): Promise<StudyKoreaPostRow | null> {
  const supabase = await createClient();
  const { data, error } = await applyForumPostExclusions(
    supabase.from("study_korea_posts").select(POST_SELECT)
  )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  if (isForumExcludedPost(data)) return null;

  const cat = normalizePostCategory(data.category, data.subcategory);
  if (cat !== normalizePostCategory(category)) return null;

  return data as StudyKoreaPostRow;
}

export async function getPublishedPostsForSitemap(limit = 2000) {
  const supabase = await createClient();
  const { data } = await applyForumPostExclusions(
    supabase.from("study_korea_posts").select("slug,category,subcategory,created_at")
  )
    .eq("is_published", true)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as {
    slug: string;
    category: string;
    subcategory: string | null;
    updated_at?: string;
    created_at: string;
  }[];
}

export async function getRelatedPosts(
  postId: string,
  category: string,
  limit = 5
): Promise<StudyKoreaPostRow[]> {
  const supabase = await createClient();
  const { data } = await applyForumPostExclusions(
    supabase.from("study_korea_posts").select(POST_SELECT)
  )
    .eq("is_published", true)
    .or(buildForumCategoryOrFilter(category))
    .neq("id", postId)
    .not("slug", "is", null)
    .order("upvotes", { ascending: false })
    .limit(limit);

  return ((data ?? []) as StudyKoreaPostRow[]).filter(
    (row) => !isForumExcludedPost(row)
  );
}
