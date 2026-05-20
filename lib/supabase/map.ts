import type { AdmissionRecord, Comment } from "@/lib/types";
import type { AdmissionsRow } from "./types";

export function rowToAdmissionRecord(row: AdmissionsRow): AdmissionRecord {
  return {
    id: row.id,
    university: row.university,
    universityEn: row.university_en,
    major: row.major,
    year: row.year,
    admissionType: row.admission_type,
    status: row.status as AdmissionRecord["status"],
    createdAt: new Date(row.created_at),
    source: row.source as AdmissionRecord["source"],
    username: row.username ?? undefined,
    testScores: (row.test_scores as AdmissionRecord["testScores"]) ?? undefined,
    gpa: (row.gpa as AdmissionRecord["gpa"]) ?? undefined,
    specialSkills: (row.special_skills as string[] | null) ?? undefined,
    review: row.review ?? undefined,
    likes: row.likes ?? undefined,
    comments: (row.comments as Comment[] | null)?.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
    })),
  };
}
