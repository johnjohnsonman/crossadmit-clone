import { MigrateStepError } from "@/lib/admissions/migrate-step-error";
import { extractAdmissionFromPost } from "@/lib/pipeline/study-korea/extract-admission-review";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { StudyKoreaPostRow } from "./migrate-admission-post";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function loadStudyKoreaPost(
  supabase: AdminClient,
  postId: string
): Promise<StudyKoreaPostRow | null> {
  const { data, error } = await supabase
    .from("study_korea_posts")
    .select("id, title, content, url")
    .eq("id", postId)
    .single();

  if (error || !data) return null;
  return data as StudyKoreaPostRow;
}

export async function loadUniversitiesForExtract(supabase: AdminClient) {
  const { data, error } = await supabase
    .from("universities")
    .select("id, name_kr, name_en")
    .eq("is_active", true);

  if (!error) {
    return (data ?? []) as {
      id: number;
      name_kr: string;
      name_en: string | null;
    }[];
  }

  console.warn("[MIGRATE] universities is_active filter failed:", error.message);

  const fallback = await supabase
    .from("universities")
    .select("id, name_kr, name_en");

  if (fallback.error) {
    throw new MigrateStepError(
      "universities_fetch",
      fallback.error.message,
      fallback.error
    );
  }

  return (fallback.data ?? []) as {
    id: number;
    name_kr: string;
    name_en: string | null;
  }[];
}

export async function extractFromStudyKoreaPost(
  supabase: AdminClient,
  post: StudyKoreaPostRow
) {
  let universities;
  try {
    universities = await loadUniversitiesForExtract(supabase);
    console.log("[MIGRATE] universities_fetch:", universities.length);
  } catch (e) {
    if (e instanceof MigrateStepError) throw e;
    throw new MigrateStepError(
      "universities_fetch",
      e instanceof Error ? e.message : String(e),
      e
    );
  }

  try {
    return await extractAdmissionFromPost(
      post.title ?? "",
      post.content ?? "",
      universities
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const step =
      msg.includes("AI 파싱") || msg.includes("JSON")
        ? "json_parse"
        : "claude_extract";
    throw new MigrateStepError(step, msg, e);
  }
}
