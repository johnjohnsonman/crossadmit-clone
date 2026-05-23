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

  if (error) throw new Error(error.message);
  return (data ?? []) as {
    id: number;
    name_kr: string;
    name_en: string | null;
  }[];
}

export async function extractFromStudyKoreaPost(
  supabase: AdminClient,
  post: StudyKoreaPostRow
) {
  const universities = await loadUniversitiesForExtract(supabase);
  return extractAdmissionFromPost(
    post.title ?? "",
    post.content ?? "",
    universities
  );
}
