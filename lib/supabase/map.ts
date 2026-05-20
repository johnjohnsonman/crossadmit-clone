import type { AdmissionRecord, Comment } from "@/lib/types";
import type { AdmissionsRow } from "./types";

export function rowToAdmissionRecord(row: AdmissionsRow): AdmissionRecord {
  const commentsRaw = row.comments as Comment[] | null | undefined;

  return {
    id: row.id,
    university: row.university,
    universityEn: row.university_en,
    major: row.major,
    year: row.year,
    admissionType: row.admission_type,
    status: row.status,
    createdAt: new Date(row.created_at),
    source: row.source as AdmissionRecord["source"],
    username: row.username ?? undefined,
    testScores: (row.test_scores as AdmissionRecord["testScores"]) ?? undefined,
    gpa: (row.gpa as AdmissionRecord["gpa"]) ?? undefined,
    specialSkills:
      (row.special_skills as string[] | null)?.filter(Boolean) ?? undefined,
    review: row.review ?? undefined,
    summary: row.summary ?? undefined,
    rawContent: row.raw_content ?? undefined,
    pros: row.pros ?? undefined,
    cons: row.cons ?? undefined,
    tips: row.tips ?? undefined,
    visaType: row.visa_type ?? undefined,
    languageProficiency: row.language_proficiency ?? undefined,
    topikLevel: row.topik_level ?? undefined,
    published: row.published,
    nationality: row.nationality ?? undefined,
    likes: row.likes ?? undefined,
    comments: commentsRaw?.map((c) => ({
      ...c,
      createdAt:
        c.createdAt instanceof Date
          ? c.createdAt
          : new Date(c.createdAt as unknown as string),
    })),
  };
}
