import { createAdminClient } from "@/lib/supabase/admin";
import { categoryToSubcategory } from "@/lib/pipeline/study-korea/categories";
import { normalizeStudyKoreaCategory } from "@/lib/pipeline/study-korea/categories";
import { postPath } from "@/lib/forum/reddit-categories";
import { generateSlug } from "@/lib/utils/slug";
import { generateAIGuide } from "./generator";

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

export async function processNextGuideTopic(): Promise<{
  ok: true;
  topic_id: string;
  post_id: string;
  redirect: string;
  title: string;
} | {
  ok: false;
  reason: string;
}> {
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
    return { ok: false, reason: "No pending topics in queue" };
  }

  const topicRow = topic as GuideTopicRow;
  const keywords = Array.isArray(topicRow.keywords) ? topicRow.keywords : [];

  const guide = await generateAIGuide({
    topic_title: topicRow.topic_title,
    category: topicRow.category,
    keywords,
    reference_urls: topicRow.reference_urls ?? [],
  });

  const category = normalizeStudyKoreaCategory(topicRow.category);
  const sourceId = `ai_${topicRow.id.replace(/-/g, "").slice(0, 16)}`;
  const mergedSources = [
    ...(topicRow.reference_urls ?? []),
    ...guide.sources,
  ].filter((u, i, a) => u && a.indexOf(u) === i);

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
      ai_summary_kr: guide.summary_ko,
      ai_title_en: guide.title_en,
      ai_summary_en: guide.summary_en,
      ai_content_en: guide.content_en,
      ai_content_kr: guide.content_ko,
      ai_tags: keywords.slice(0, 8),
      is_published: true,
      is_ai_generated: true,
      ai_sources: mergedSources,
      ai_last_updated: now,
      moderation_status: "auto_approved",
      source_created_at: now,
    })
    .select("id")
    .single();

  if (insertErr || !post?.id) {
    console.error("[ai-guides] insert post failed:", insertErr?.message);
    throw new Error(insertErr?.message ?? "Failed to save guide post");
  }

  const slug = generateSlug(guide.title_en, post.id as string);
  const path = postPath(category, slug);

  await supabase
    .from("study_korea_posts")
    .update({ slug, url: path })
    .eq("id", post.id);

  await supabase
    .from("ai_guide_topics")
    .update({
      status: "completed",
      generated_post_id: post.id,
      generated_at: now,
    })
    .eq("id", topicRow.id);

  return {
    ok: true,
    topic_id: topicRow.id,
    post_id: post.id as string,
    redirect: path,
    title: guide.title_en,
  };
}
