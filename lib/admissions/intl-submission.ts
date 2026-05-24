import type { AdmitTrack } from "@/lib/admissions/admit-track";

export type IntlSchoolStatus =
  | "admitted"
  | "waitlisted"
  | "rejected"
  | "enrolled";

export type IntlAdmissionTrack =
  | "international"
  | "overseas_kr"
  | "gks"
  | "other";

export const INTL_TRACK_OPTIONS: {
  value: IntlAdmissionTrack;
  label: string;
  admitTrack: AdmitTrack;
}[] = [
  {
    value: "international",
    label: "International student track",
    admitTrack: "international",
  },
  {
    value: "overseas_kr",
    label: "Overseas Korean track",
    admitTrack: "overseas_kr",
  },
  { value: "gks", label: "Global Korea Scholarship (GKS)", admitTrack: "gks" },
  { value: "other", label: "Other (please specify)", admitTrack: "international" },
];

export const HS_SCHOOL_TYPES = [
  "Public",
  "Private",
  "International school",
  "IB programme",
  "National curriculum (non-KR)",
  "Other",
] as const;

export const HS_COUNTRIES = [
  "Vietnam",
  "China",
  "Indonesia",
  "Thailand",
  "Philippines",
  "Mongolia",
  "United States",
  "Japan",
  "Malaysia",
  "India",
  "Bangladesh",
  "Nepal",
  "Myanmar",
  "Uzbekistan",
  "Kazakhstan",
  "Other",
] as const;

export type IntlFormDraft = {
  step: number;
  handle: string;
  year: string;
  track: IntlAdmissionTrack;
  trackOther: string;
  hsCountry: string;
  highSchoolType: string;
  schools: Array<{
    id: string;
    universityInput: string;
    univId: number;
    status: IntlSchoolStatus;
  }>;
  /** Free-form scores block (SAT, IB, TOPIK, etc.) */
  scoresText: string;
  gpa: string;
  gpaSystem: string;
  narrative: {
    extracurriculars: string;
    essays: string;
    interview: string;
    tips: string;
  };
};

export const INTL_DRAFT_STORAGE_KEY = "crossadmit_intl_draft";

export function trackToAdmitTrack(
  track: IntlAdmissionTrack,
  trackOther: string
): AdmitTrack {
  const found = INTL_TRACK_OPTIONS.find((o) => o.value === track);
  if (track === "other" && trackOther.trim()) return "international";
  return found?.admitTrack ?? "international";
}

export function buildIntlInputScore(draft: Pick<IntlFormDraft, "scoresText">): string {
  return draft.scoresText.trim();
}

export function buildIntlInputGpa(draft: Pick<IntlFormDraft, "gpa" | "gpaSystem">): string {
  const g = draft.gpa.trim();
  const sys = draft.gpaSystem.trim();
  if (!g && !sys) return "";
  if (g && sys) return `${g} (${sys})`;
  return g || sys;
}

export function buildIntlSpecialty(
  draft: Pick<IntlFormDraft, "narrative" | "track" | "trackOther">
): string {
  const parts: string[] = [];
  if (draft.track === "other" && draft.trackOther.trim())
    parts.push(`Admission track (other): ${draft.trackOther.trim()}`);
  const { extracurriculars, essays, interview, tips } = draft.narrative;
  if (extracurriculars.trim())
    parts.push(`Extracurriculars:\n${extracurriculars.trim()}`);
  if (essays.trim()) parts.push(`Essay topics:\n${essays.trim()}`);
  if (interview.trim()) parts.push(`Interview:\n${interview.trim()}`);
  if (tips.trim()) parts.push(`Tips:\n${tips.trim()}`);
  return parts.join("\n\n");
}

export const STEP_MICROCOPY: Record<
  number,
  { why: string; anon: string; title?: string }
> = {
  1: {
    why: "To help future applicants from similar backgrounds.",
    anon: "We never publish real names.",
    title: "About you",
  },
  2: {
    why: "We match schools to our Korean university database.",
    anon: "You can list every school you applied to.",
    title: "Universities",
  },
  3: {
    why: "Realistic score ranges help others calibrate their chances.",
    anon: "All fields are optional — share only what you want.",
    title: "Profile & scores",
  },
  4: {
    why: "Verified stories get a badge (optional upload).",
    anon: "Screenshots are stored securely and not shared publicly in full.",
    title: "Verification",
  },
};

export function intlStatusToKorean(
  status: IntlSchoolStatus
): "합격" | "등록" | "불합격" {
  if (status === "enrolled") return "등록";
  if (status === "admitted") return "합격";
  return "불합격";
}

export function validateIntlSchools(
  schools: { status: IntlSchoolStatus }[]
): { ok: true } | { ok: false; error: string } {
  const filled = schools.filter((s) => s.status);
  const enrolled = filled.filter((s) => s.status === "enrolled").length;
  const admitted = filled.filter(
    (s) => s.status === "admitted" || s.status === "enrolled"
  ).length;

  if (enrolled > 1) {
    return { ok: false, error: "Only one university can be marked as Enrolled." };
  }
  if (admitted >= 2 && enrolled === 0) {
    return {
      ok: false,
      error:
        "If you were admitted to multiple universities, please mark one as Enrolled.",
    };
  }
  return { ok: true };
}
