import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ForumComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  anonymous_nickname: string;
  created_at: string;
  upvotes_count: number;
};

const COMMENT_SELECT =
  "id,post_id,parent_id,content,anonymous_nickname,created_at,upvotes_count";

export async function getCommentsForPost(
  postId: string
): Promise<ForumComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_korea_comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .in("moderation_status", ["approved", "auto_approved"])
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[comments] fetch failed:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    post_id: r.post_id as string,
    parent_id: (r.parent_id as string | null) ?? null,
    content: String(r.content ?? ""),
    anonymous_nickname: String(r.anonymous_nickname ?? "Anonymous"),
    created_at: String(r.created_at),
    upvotes_count: Number(r.upvotes_count ?? 0),
  }));
}

export async function incrementPostCommentCount(postId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("study_korea_posts")
    .select("comments_count, comment_count")
    .eq("id", postId)
    .maybeSingle();

  const current =
    Number(data?.comments_count ?? data?.comment_count ?? 0) + 1;

  await supabase
    .from("study_korea_posts")
    .update({ comments_count: current, comment_count: current })
    .eq("id", postId);
}
