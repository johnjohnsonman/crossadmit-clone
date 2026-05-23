import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils/slug";
import { ADMISSION_QUERIES } from "./admission-queries";
import { searchNaverWebkr } from "./naver-webkr";
import { normalizeNaverPostUrl, webkrPostSourceId } from "./naver-url";

const ADMISSION_KEYWORD =
  /합격|admitted|accept|입학|등록|진학|수시|정시/i;

export type CollectedAdmissionPost = {
  id: string;
  title: string;
  url: string;
};

export async function collectAdmissionPosts(): Promise<
  CollectedAdmissionPost[]
> {
  const supabase = createAdminClient();
  const collected: CollectedAdmissionPost[] = [];

  for (const query of ADMISSION_QUERIES) {
    const items = await searchNaverWebkr(query, 30);
    console.log(`[ADMISSION] "${query}": ${items.length} items`);

    for (const item of items) {
      if (!item.link.trim()) continue;

      const url = normalizeNaverPostUrl(item.link) || item.link.trim();
      const fullText = `${item.title} ${item.description}`;
      if (!ADMISSION_KEYWORD.test(fullText)) continue;

      const { data: existing } = await supabase
        .from("study_korea_posts")
        .select("id")
        .eq("source", "naver_webkr")
        .eq("url", url)
        .maybeSingle();

      if (existing) continue;

      const source_id = webkrPostSourceId(url);
      const slug = generateSlug(item.title || "합격후기", source_id);
      const description = item.description;

      const { data, error } = await supabase
        .from("study_korea_posts")
        .insert({
          source: "naver_webkr",
          source_id,
          slug,
          title: item.title.slice(0, 500),
          content: description,
          url,
          author: "",
          category: "admission",
          subcategory: "admission",
          university: "",
          language: "ko",
          is_published: false,
          moderation_status: "pending",
          is_admission_post: true,
          post_type: "scraped",
          ai_summary: description.slice(0, 500),
          ai_summary_kr: description.slice(0, 500),
        })
        .select("id, title, url")
        .single();

      if (!error && data) {
        collected.push(data as CollectedAdmissionPost);
      } else if (error) {
        console.warn("[ADMISSION] insert failed:", error.message);
      }

      await new Promise((r) => setTimeout(r, 100));
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return collected;
}
