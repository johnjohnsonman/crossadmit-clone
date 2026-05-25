import {
  type ClassificationResult,
  type ExtractedAdmissionData,
  type ExtractedScores,
  runStage1Filter,
  runStage2Classifier,
} from "@/lib/classifiers/admission-classifier";
import { insertAdmissionFromScrape } from "@/lib/admissions/scrape-insert";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeStudyKoreaContent } from "@/lib/pipeline/study-korea/claude";
import { fillEmptySummaries, shouldSavePost } from "@/lib/pipeline/study-korea/relevance";
import { upsertStudyKoreaPost } from "@/lib/pipeline/study-korea/save";
import type { StudyKoreaSource } from "@/lib/pipeline/study-korea/types";
import { normalizeUniversitySlug } from "@/lib/pipeline/study-korea/university-map";
import type { RouteResult, ScrapedPost } from "@/lib/scrapers/types";

export async function isDuplicateUrl(url: string): Promise<boolean> {
  if (!url?.trim()) return false;
  const admin = createAdminClient();
  const u = url.trim();

  const [{ data: adm }, { data: sk }] = await Promise.all([
    admin.from("admissions").select("id").eq("source_url", u).limit(1),
    admin.from("study_korea_posts").select("id").eq("url", u).limit(1),
  ]);

  return Boolean(adm?.length || sk?.length);
}

export async function insertGeneralPost(
  post: ScrapedPost,
  reason: string
): Promise<"saved" | "skipped" | "failed"> {
  const title = post.title.trim();
  const content = post.body.trim();
  if (!title && !content) return "skipped";

  const source = post.source as StudyKoreaSource;

  try {
    let category = "general";
    let university = "";
    let ai_summary = title;
    let ai_summary_kr = title;
    let ai_title_en = "";
    let ai_summary_en = "";
    let ai_content_en = "";
    let ai_tags: string[] = [];

    if (!post.skipStudyKoreaClaude) {
      const analysis = fillEmptySummaries(
        title,
        content,
        await analyzeStudyKoreaContent(title, content.slice(0, 500), {
          source,
          url: post.url,
          author: post.author,
          subreddit: post.subreddit,
        })
      );

      if (!shouldSavePost(post.subreddit, title, content, analysis)) {
        return "skipped";
      }

      category = analysis.category;
      university =
        normalizeUniversitySlug(analysis.university, `${title} ${content}`) ||
        analysis.university;
      ai_summary = analysis.ai_summary;
      ai_summary_kr = analysis.ai_summary_kr;
      ai_title_en = analysis.ai_title_en;
      ai_summary_en = analysis.ai_summary_en;
      ai_content_en = analysis.ai_content_en;
      ai_tags = analysis.ai_tags;
    }

    return await upsertStudyKoreaPost({
      source,
      source_id: post.source_id,
      title: title || content.slice(0, 120),
      content: content.slice(0, 8000),
      url: post.url,
      author: post.author ?? "",
      upvotes: post.upvotes ?? 0,
      comment_count: post.comment_count ?? 0,
      source_created_at: post.source_created_at ?? null,
      category,
      university,
      university_id: post.university_id ?? undefined,
      language: post.language ?? "en",
      ai_summary: ai_summary || `[routed general: ${reason}]`,
      ai_summary_kr,
      ai_title_en: ai_title_en || title,
      ai_summary_en: ai_summary_en || ai_summary,
      ai_content_en: ai_content_en || content.slice(0, 8000),
      ai_tags,
      is_published: true,
    });
  } catch (e) {
    console.error("[router] general insert failed:", e);
    return "failed";
  }
}

function decodeBasicHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function pickGradCafeField(body: string, label: string): string | null {
  const re = new RegExp(`^${label}:\\s*(.+)$`, "im");
  const m = body.match(re);
  return m?.[1] ? decodeBasicHtmlEntities(m[1]) : null;
}

function parseGradCafeYear(post: ScrapedPost, season: string | null): number | null {
  const seasonYear = season?.match(/\b(20\d{2})\b/)?.[1];
  if (seasonYear) return parseInt(seasonYear, 10);
  if (post.source_created_at) {
    const d = new Date(post.source_created_at);
    if (!Number.isNaN(d.getTime())) return d.getUTCFullYear();
  }
  return null;
}

function buildEmptyScores(): ExtractedScores {
  return {
    sat: null,
    act: null,
    ib: null,
    ap: null,
    a_level: null,
    topik: null,
    toefl: null,
    ielts: null,
    gpa: null,
    other: null,
  };
}

function parseGradCafeResult(decision: string | null): "admitted" | "enrolled" | "rejected" | "waitlisted" {
  const d = (decision ?? "").toLowerCase();
  if (/enrolled|matriculat/.test(d)) return "enrolled";
  if (/accept|admit/.test(d)) return "admitted";
  if (/wait/.test(d) || /interview/.test(d)) return "waitlisted";
  if (/reject|denied/.test(d)) return "rejected";
  return "admitted";
}

function buildGradCafeFallbackData(post: ScrapedPost): ExtractedAdmissionData {
  const institution = pickGradCafeField(post.body, "Institution") || "University";
  const program = pickGradCafeField(post.body, "Program");
  const degree = pickGradCafeField(post.body, "Degree");
  const decision = pickGradCafeField(post.body, "Decision");
  const season = pickGradCafeField(post.body, "Season");
  const gpa = pickGradCafeField(post.body, "GPA");
  const comments = pickGradCafeField(post.body, "Comments");

  const scores = buildEmptyScores();
  scores.gpa = gpa;

  const greParts: string[] = [];
  for (const label of ["GRE Q", "GRE V", "GRE AW", "GRE Subject"]) {
    const v = pickGradCafeField(post.body, label);
    if (v) greParts.push(`${label}: ${v}`);
  }
  if (greParts.length > 0) {
    scores.other = greParts.join("\n");
  }

  return {
    display_name: null,
    year_admitted: parseGradCafeYear(post, season),
    admit_track: "international",
    degree_level: "graduate",
    original_language: "en",
    home_country: null,
    high_school_type: null,
    universities: [
      {
        name: institution,
        department: decodeBasicHtmlEntities(program || degree || "") || null,
        result: parseGradCafeResult(decision),
      },
    ],
    scores,
    extracurriculars: null,
    essays: null,
    interview:
      decision && /interview/i.test(decision)
        ? `GradCafe decision field indicates interview stage: ${decision}`
        : null,
    tips: comments || null,
  };
}

function mergeGradCafeAdmissionData(
  classified: ExtractedAdmissionData | null,
  fallback: ExtractedAdmissionData
): ExtractedAdmissionData {
  if (!classified) return fallback;
  return {
    ...fallback,
    ...classified,
    universities:
      classified.universities && classified.universities.length > 0
        ? classified.universities
        : fallback.universities,
    scores: {
      ...fallback.scores,
      ...classified.scores,
    },
    degree_level: classified.degree_level || fallback.degree_level,
    original_language: classified.original_language || fallback.original_language,
  };
}

async function routeGradCafeToAdmissions(
  post: ScrapedPost,
  stage1: Awaited<ReturnType<typeof runStage1Filter>>
): Promise<RouteResult> {
  let classification: ClassificationResult | null = null;
  try {
    classification = await runStage2Classifier(
      post.title.trim(),
      post.body.trim(),
      post.source,
      post.url
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[router] gradcafe classifier failed:", msg);
  }

  const fallback = buildGradCafeFallbackData(post);
  const data = mergeGradCafeAdmissionData(classification?.data ?? null, fallback);
  const confidence = classification?.confidence ?? 0;
  const shouldPublish =
    classification?.classification === "admission" && confidence >= 0.7;
  const reasoning = [
    "gradcafe_forced_admission",
    `stage1=${stage1.pass ? "pass" : stage1.reason}`,
    classification?.reasoning ?? "stage2_unavailable",
  ]
    .filter(Boolean)
    .join(" | ");

  const id = await insertAdmissionFromScrape(post, data, {
    needs_review: !shouldPublish,
    published: shouldPublish,
    confidence,
    reasoning,
  });

  console.log(
    `[router] inserted gradcafe to: admissions (id=${id}, ${
      shouldPublish ? "published" : "review_needed"
    })`
  );

  if (shouldPublish) {
    return {
      routed: "admission",
      admissionId: id,
      classification: "admission",
      confidence,
    };
  }

  return {
    routed: "review_needed",
    admissionId: id,
    classification: "review_needed",
    confidence,
  };
}

export async function routeScrapedPost(post: ScrapedPost): Promise<RouteResult> {
  console.log(`[router] processing post: ${post.url}`);

  if (await isDuplicateUrl(post.url)) {
    console.log(`[router] duplicate skip: ${post.url}`);
    return { routed: "duplicate", reason: "duplicate_url" };
  }

  const title = post.title.trim();
  const body = post.body.trim();
  if (!title && !body) {
    return { routed: "duplicate", reason: "empty" };
  }

  const stage1 = await runStage1Filter(title, body);

  if (post.source === "gradcafe") {
    return routeGradCafeToAdmissions(post, stage1);
  }

  if (!stage1.pass) {
    const status = await insertGeneralPost(post, stage1.reason);
    if (status === "saved") {
      console.log(`[router] inserted to: study_korea_posts (rule_filter)`);
      return { routed: "general", reason: "rule_filter" };
    }
    if (status === "skipped") {
      return { routed: "duplicate", reason: "general_skipped" };
    }
    return { routed: "general", reason: "general_failed" };
  }

  const classification = await runStage2Classifier(
    title,
    body,
    post.source,
    post.url
  );

  if (
    classification.classification === "admission" &&
    classification.data
  ) {
    const id = await insertAdmissionFromScrape(post, classification.data, {
      needs_review: false,
      published: true,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
    });
    console.log(`[router] inserted to: admissions (id=${id}, published)`);
    return {
      routed: "admission",
      admissionId: id,
      classification: "admission",
      confidence: classification.confidence,
    };
  }

  if (
    classification.classification === "review_needed" &&
    classification.data
  ) {
    const id = await insertAdmissionFromScrape(post, classification.data, {
      needs_review: true,
      published: false,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
    });
    console.log(`[router] inserted to: admissions (id=${id}, review_needed)`);
    return {
      routed: "review_needed",
      admissionId: id,
      classification: "review_needed",
      confidence: classification.confidence,
    };
  }

  const status = await insertGeneralPost(
    post,
    classification.reasoning || "llm_general"
  );
  if (status === "saved") {
    console.log(`[router] inserted to: study_korea_posts (llm_general)`);
    return { routed: "general", reason: classification.reasoning };
  }
  return { routed: "duplicate", reason: "general_skipped" };
}

export function scrapedPostFromRaw(item: {
  source_id: string;
  title: string;
  content: string;
  url: string;
  author?: string;
  subreddit?: string;
  language?: string;
  source_created_at?: string | null;
  upvotes?: number;
  comment_count?: number;
  university_id?: number | null;
  skipClaude?: boolean;
  source: string;
}): ScrapedPost {
  return {
    source: item.source,
    source_id: item.source_id,
    title: item.title,
    body: item.content,
    url: item.url,
    author: item.author,
    subreddit: item.subreddit,
    language: item.language,
    source_created_at: item.source_created_at,
    upvotes: item.upvotes,
    comment_count: item.comment_count,
    university_id: item.university_id,
    skipStudyKoreaClaude: item.skipClaude,
  };
}
