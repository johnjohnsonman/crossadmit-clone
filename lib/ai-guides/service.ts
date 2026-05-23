import { createAdminClient } from "@/lib/supabase/admin";
import {
  categoryToSubcategory,
  normalizeStudyKoreaCategory,
} from "@/lib/pipeline/study-korea/categories";
import { postPath } from "@/lib/forum/reddit-categories";
import { generateSlug } from "@/lib/utils/slug";
import {
  generateEnglishGuide,
  translateGuideToKorean,
} from "./generator";

export type GuideTopicRow = {
  id: string;
  topic_title: string;
  category: string;
  priority: number;
  keywords: string[];
  reference_urls: string[];
  status: string;
  generated_post_id: string | null;
  created_at: string;
  generated_at: string | null;
};

export type GuideQueueStatus = {
  total: number;
  pending: number;
  generating_kr: number;
  completed: number;
  topics: GuideTopicRow[];
  generated_posts: {
    id: string;
    topic_title: string;
    slug: string | null;
    category: string;
    path: string | null;
  }[];
};

export async function getGuideQueueStatus(): Promise<GuideQueueStatus> {
  const supabase = createAdminClient();
  const { data: topics, error } = await supabase
    .from("ai_guide_topics")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (topics ?? []) as GuideTopicRow[];
  const pending = rows.filter((t) => t.status === "pending").length;
  const generating_kr = rows.filter((t) => t.status === "generating_kr").length;
  const completed = rows.filter((t) => t.status === "completed").length;

  const generated_posts: GuideQueueStatus["generated_posts"] = [];
  for (const t of rows.filter((t) => t.generated_post_id)) {
    const { data: post } = await supabase
      .from("study_korea_posts")
      .select("id, slug, category, title")
      .eq("id", t.generated_post_id!)
      .maybeSingle();
    if (post) {
      const cat = normalizeStudyKoreaCategory(post.category);
      generated_posts.push({
        id: post.id as string,
        topic_title: t.topic_title,
        slug: post.slug as string | null,
        category: cat,
        path: post.slug ? postPath(cat, post.slug as string) : null,
      });
    }
  }

  return {
    total: rows.length,
    pending,
    generating_kr,
    completed,
    topics: rows,
    generated_posts,
  };
}

export async function addGuideTopic(input: {
  topic_title: string;
  category: string;
  keywords: string[];
  priority: number;
  reference_urls?: string[];
}): Promise<GuideTopicRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_guide_topics")
    .insert({
      topic_title: input.topic_title.trim(),
      category: normalizeStudyKoreaCategory(input.category),
      keywords: input.keywords,
      priority: input.priority,
      reference_urls: input.reference_urls ?? [],
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  return data as GuideTopicRow;
}

/** Step 1: English guide only, unpublished until translation */
export async function generateEnglishGuideForNextTopic(): Promise<
  | {
      success: true;
      topic_id: string;
      topic_title: string;
      post_id: string;
      stage: "en_done";
      next_action: "translate";
    }
  | { success: false; error: string }
> {
  const supabase = createAdminClient();

  const { data: topic, error: topicErr } = await supabase
    .from("ai_guide_topics")
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (topicErr) throw new Error(topicErr.message);
  if (!topic) {
    return { success: false, error: "No pending topics in queue" };
  }

  const topicRow = topic as GuideTopicRow;
  const keywords = Array.isArray(topicRow.keywords) ? topicRow.keywords : [];

  const guide = await generateEnglishGuide({
    topic_title: topicRow.topic_title,
    category: topicRow.category,
    keywords,
    reference_urls: topicRow.reference_urls ?? [],
  });

  const category = normalizeStudyKoreaCategory(topicRow.category);
  const sourceId = `ai_${topicRow.id.replace(/-/g, "").slice(0, 16)}`;
  const now = new Date().toISOString();

  const { data: post, error: insertErr } = await supabase
    .from("study_korea_posts")
    .insert({
      source: "ai_guide",
      source_id: sourceId,
      post_type: "ai_guide",
      title: guide.title_en,
      content: guide.content_en,
      url: "",
      author: "CrossAdmit",
      category,
      subcategory: categoryToSubcategory(category),
      language: "en",
      upvotes: 0,
      comment_count: 0,
      upvotes_count: 0,
      downvotes_count: 0,
      comments_count: 0,
      views_count: 0,
      ai_summary: guide.summary_en,
      ai_summary_kr: "",
      ai_title_en: guide.title_en,
      ai_summary_en: guide.summary_en,
      ai_content_en: guide.content_en,
      ai_content_kr: "",
      ai_tags: keywords.slice(0, 8),
      is_published: false,
      is_ai_generated: true,
      ai_sources: guide.sources,
      ai_last_updated: now,
      moderation_status: "pending_translation",
      source_created_at: now,
    })
    .select("id")
    .single();

  if (insertErr || !post?.id) {
    throw new Error(insertErr?.message ?? "Failed to save English guide");
  }

  const { error: topicUpdErr } = await supabase
    .from("ai_guide_topics")
    .update({
      status: "generating_kr",
      generated_post_id: post.id,
    })
    .eq("id", topicRow.id);

  if (topicUpdErr) throw new Error(topicUpdErr.message);

  return {
    success: true,
    topic_id: topicRow.id,
    topic_title: topicRow.topic_title,
    post_id: post.id as string,
    stage: "en_done",
    next_action: "translate",
  };
}

/** Step 2: Korean translation and publish */
export async function translateGuidePost(postId: string): Promise<
  | {
      success: true;
      post_id: string;
      topic_id: string;
      topic_title: string;
      stage: "completed";
      redirect: string;
    }
  | { success: false; error: string }
> {
  const supabase = createAdminClient();

  const { data: post, error: postErr } = await supabase
    .from("study_korea_posts")
    .select(
      "id, ai_title_en, ai_summary_en, ai_content_en, category, moderation_status"
    )
    .eq("id", postId)
    .maybeSingle();

  if (postErr) throw new Error(postErr.message);
  if (!post) {
    return { success: false, error: "Post not found" };
  }

  const titleEn = String(post.ai_title_en ?? "").trim();
  const contentEn = String(post.ai_content_en ?? "").trim();
  if (!titleEn || !contentEn) {
    return { success: false, error: "English guide content missing on post" };
  }

  const { data: topic } = await supabase
    .from("ai_guide_topics")
    .select("*")
    .eq("generated_post_id", postId)
    .maybeSingle();

  const kr = await translateGuideToKorean({
    title_en: titleEn,
    summary_en: String(post.ai_summary_en ?? "").trim(),
    content_en: contentEn,
  });

  const category = normalizeStudyKoreaCategory(post.category);
  const slug = generateSlug(titleEn, postId);
  const path = postPath(category, slug);
  const now = new Date().toISOString();

  const { error: updErr } = await supabase
    .from("study_korea_posts")
    .update({
      ai_content_kr: kr.content_kr,
      ai_summary_kr: kr.summary_kr,
      ai_summary: kr.summary_kr,
      slug,
      url: path,
      is_published: true,
      moderation_status: "auto_approved",
      ai_last_updated: now,
    })
    .eq("id", postId);

  if (updErr) throw new Error(updErr.message);

  if (topic) {
    await supabase
      .from("ai_guide_topics")
      .update({
        status: "completed",
        generated_at: now,
      })
      .eq("id", topic.id);
  }

  return {
    success: true,
    post_id: postId,
    topic_id: topic?.id ?? "",
    topic_title: topic?.topic_title ?? titleEn,
    stage: "completed",
    redirect: path,
  };
}

/** Full pipeline for cron (generate + translate) */
export async function generateAndTranslateNextGuide(): Promise<{
  success: boolean;
  skipped?: boolean;
  error?: string;
  en?: Awaited<ReturnType<typeof generateEnglishGuideForNextTopic>>;
  kr?: Awaited<ReturnType<typeof translateGuidePost>>;
}> {
  const en = await generateEnglishGuideForNextTopic();
  if (!en.success) {
    return {
      success: false,
      skipped: en.error.includes("No pending"),
      error: en.error,
      en,
    };
  }

  const kr = await translateGuidePost(en.post_id);
  if (!kr.success) {
    return { success: false, error: kr.error, en, kr };
  }

  return { success: true, en, kr };
}
