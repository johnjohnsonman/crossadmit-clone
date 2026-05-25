import { createAdminClient } from "@/lib/supabase/admin";
import { generateAdmissionTitle } from "@/lib/admissions/auto-title";
import type { ExtractedAdmissionData } from "@/lib/classifiers/admission-classifier";
import { matchUniversities } from "@/lib/admissions/university-match";
import type { AdmitTrack } from "@/lib/admissions/admit-track";
import { isAdmitTrack } from "@/lib/admissions/admit-track";
import type { DegreeLevel } from "@/lib/admissions/degree-level";
import { isDegreeLevel } from "@/lib/admissions/degree-level";
import { normalizeOriginalLanguage } from "@/lib/admissions/original-language";
import type { ScrapedPost } from "@/lib/scrapers/types";

export function formatScores(
  scores: ExtractedAdmissionData["scores"] | null | undefined
): string {
  if (!scores) return "";
  const lines: string[] = [];
  const push = (label: string, v: string | null) => {
    if (v?.trim()) lines.push(`${label}: ${v.trim()}`);
  };
  push("SAT", scores.sat);
  push("ACT", scores.act);
  push("IB", scores.ib);
  push("AP", scores.ap);
  push("A-Level", scores.a_level);
  push("TOPIK", scores.topik);
  push("TOEFL", scores.toefl);
  push("IELTS", scores.ielts);
  if (scores.other?.trim()) lines.push(scores.other.trim());
  return lines.join("\n");
}

export function formatSpecialty(data: ExtractedAdmissionData): string {
  const parts: string[] = [];
  if (data.extracurriculars?.trim()) {
    parts.push(`Extracurriculars:\n${data.extracurriculars.trim()}`);
  }
  if (data.essays?.trim()) parts.push(`Essay topics:\n${data.essays.trim()}`);
  if (data.interview?.trim()) parts.push(`Interview:\n${data.interview.trim()}`);
  if (data.tips?.trim()) parts.push(`Tips:\n${data.tips.trim()}`);
  return parts.join("\n\n");
}

function mapAdmitTrack(raw: string | undefined): AdmitTrack {
  if (raw === "graduate") return "regular_kr";
  if (raw && isAdmitTrack(raw)) return raw;
  if (raw === "unknown") return "international";
  return "international";
}

function resolveDegreeLevel(
  raw: string | undefined,
  source: string
): DegreeLevel {
  if (raw && isDegreeLevel(raw)) return raw;
  if (source === "gradcafe") return "graduate";
  return "unknown";
}

function mapSchoolStatus(
  result: string
): { is_accept: number; is_regist: number } {
  if (result === "enrolled") return { is_accept: 1, is_regist: 1 };
  if (result === "admitted") return { is_accept: 1, is_regist: 0 };
  return { is_accept: 0, is_regist: 0 };
}

export async function insertAdmissionFromScrape(
  post: ScrapedPost,
  data: ExtractedAdmissionData,
  flags: {
    needs_review: boolean;
    published: boolean;
    confidence: number;
    reasoning: string;
  }
): Promise<number> {
  const admin = createAdminClient();
  const matchedSchools = await matchUniversities(data.universities);
  const hasUnmatched = matchedSchools.some((s) => !s.matched);
  const needsReview = flags.needs_review || hasUnmatched;

  const primary =
    matchedSchools.find((s) => s.result === "enrolled" && s.matched) ??
    matchedSchools.find((s) => s.result === "admitted" && s.matched) ??
    matchedSchools.find((s) => s.matched) ??
    matchedSchools[0];

  const year = data.year_admitted ?? new Date().getFullYear();
  const admitTrack = mapAdmitTrack(data.admit_track);
  const degreeLevel = resolveDegreeLevel(data.degree_level, post.source);
  const originalLanguage = normalizeOriginalLanguage(
    data.original_language,
    `${post.title}\n${post.body}`
  );
  const univName = primary?.name ?? "University";

  const title = generateAdmissionTitle({
    year,
    universityName: univName,
    departmentName: primary?.department,
    admitTrack,
    locale: "en",
  });

  const { data: row, error } = await admin
    .from("admissions")
    .insert({
      original_user_id: 0,
      user_handle: data.display_name?.trim() || "Anonymous",
      year,
      year_end: year,
      title,
      input_score: formatScores(data.scores),
      input_gpa: data.scores.gpa?.trim() || "",
      input_specialty: formatSpecialty(data),
      view_count: 0,
      likes_count: 0,
      is_verified: false,
      is_featured: false,
      published: flags.published,
      source: post.source,
      source_type: `scraped_${post.source}`,
      source_url: post.url,
      admit_track: admitTrack,
      degree_level: degreeLevel,
      original_language: originalLanguage,
      original_title: post.title.slice(0, 1000),
      original_content: post.body.slice(0, 12000),
      home_country: data.home_country,
      high_school_type: data.high_school_type,
      raw_content: post.body.slice(0, 12000),
      needs_review: needsReview,
      classifier_confidence: flags.confidence,
      classifier_reasoning: flags.reasoning,
      available_as_mentor: false,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !row?.id) {
    throw new Error(error?.message ?? "admission insert failed");
  }

  const admissionId = row.id as number;

  for (const school of matchedSchools.filter((s) => s.matched && s.univ_id)) {
    const st = mapSchoolStatus(school.result);
    await admin.from("admission_schools").insert({
      admission_id: admissionId,
      univ_id: school.univ_id,
      univ_name: school.name,
      dept_name: school.department,
      is_accept: st.is_accept,
      is_regist: st.is_regist,
      is_apply: 1,
      is_grad: 0,
    });
  }

  return admissionId;
}
