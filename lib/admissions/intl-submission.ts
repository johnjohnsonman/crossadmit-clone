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
  schools: Array<{
    id: string;
    universityInput: string;
    univId: number;
    status: IntlSchoolStatus;
  }>;
  scores: {
    satTotal: string;
    satBreakdown: string;
    act: string;
    ibTotal: string;
    ibDetail: string;
    ap: string;
    aLevel: string;
    topik: string;
    toeflIelts: string;
    gpa: string;
    gpaSystem: string;
  };
  narrative: {
    extracurriculars: string;
    essays: string;
    interview: string;
    tips: string;
  };
};

export const INTL_DRAFT_STORAGE_KEY = "crossadmit_intl_form_draft_v1";

export function trackToAdmitTrack(
  track: IntlAdmissionTrack,
  trackOther: string
): AdmitTrack {
  const found = INTL_TRACK_OPTIONS.find((o) => o.value === track);
  if (track === "other" && trackOther.trim()) return "international";
  return found?.admitTrack ?? "international";
}

export function buildIntlInputScore(scores: IntlFormDraft["scores"]): string {
  const lines: string[] = [];
  if (scores.satTotal.trim())
    lines.push(
      `SAT: ${scores.satTotal.trim()}${scores.satBreakdown.trim() ? ` (${scores.satBreakdown.trim()})` : ""}`
    );
  if (scores.act.trim()) lines.push(`ACT: ${scores.act.trim()}`);
  if (scores.ibTotal.trim())
    lines.push(
      `IB: ${scores.ibTotal.trim()}${scores.ibDetail.trim() ? ` — ${scores.ibDetail.trim()}` : ""}`
    );
  if (scores.ap.trim()) lines.push(`AP: ${scores.ap.trim()}`);
  if (scores.aLevel.trim()) lines.push(`A-Level: ${scores.aLevel.trim()}`);
  if (scores.topik.trim()) lines.push(`TOPIK: ${scores.topik.trim()}`);
  if (scores.toeflIelts.trim())
    lines.push(`TOEFL/IELTS: ${scores.toeflIelts.trim()}`);
  return lines.join("\n");
}

export function buildIntlInputGpa(scores: IntlFormDraft["scores"]): string {
  const g = scores.gpa.trim();
  const sys = scores.gpaSystem.trim();
  if (!g && !sys) return "";
  if (g && sys) return `${g} (${sys})`;
  return g || sys;
}

export function buildIntlSpecialty(
  draft: Pick<IntlFormDraft, "narrative" | "track" | "trackOther" | "hsCountry">
): string {
  const parts: string[] = [];
  if (draft.hsCountry.trim())
    parts.push(`High school country: ${draft.hsCountry.trim()}`);
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

export function buildIntlTitle(
  year: number,
  topUniv: string,
  track: IntlAdmissionTrack
): string {
  const trackLabel =
    track === "gks"
      ? "GKS"
      : track === "overseas_kr"
        ? "Overseas Korean track"
        : track === "other"
          ? "International track"
          : "International track";
  return `${year} · ${topUniv} · ${trackLabel}`;
}

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
