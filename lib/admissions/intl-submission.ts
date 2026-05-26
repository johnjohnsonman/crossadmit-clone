import type { AdmitTrack } from "@/lib/admissions/admit-track";
import type { DegreeLevel } from "@/lib/admissions/degree-level";
import { isDegreeLevel } from "@/lib/admissions/degree-level";

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
  degreeLevel: DegreeLevel;
  nationalityCode: string;
  gender: string;
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
  mentorOptIn: boolean;
  mentorIntro: string;
};

export const INTL_DRAFT_STORAGE_KEY = "crossadmit_intl_draft";

export type IntlSchoolEntry = IntlFormDraft["schools"][number];

const VALID_SCHOOL_STATUS = new Set<IntlSchoolStatus>([
  "admitted",
  "waitlisted",
  "rejected",
  "enrolled",
]);

function defaultSchoolRows(count = 2): IntlSchoolEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `default-school-${i}-${Date.now()}`,
    universityInput: "",
    univId: 0,
    status: "admitted" as const,
  }));
}

/** Ensures schools is always a non-empty array (Step 2 .map safety). */
export function normalizeIntlSchools(
  raw: unknown,
  fallback?: IntlSchoolEntry[]
): IntlSchoolEntry[] {
  const base = fallback?.length ? fallback : defaultSchoolRows();
  let list: unknown[] | null = null;
  if (Array.isArray(raw)) list = raw;
  else if (raw && typeof raw === "object") {
    const o = raw as { schoolsApplied?: unknown; schools?: unknown };
    if (Array.isArray(o.schoolsApplied)) list = o.schoolsApplied;
    else if (Array.isArray(o.schools)) list = o.schools;
  }
  if (!list?.length) return [...base];

  const normalized = list.map((item, i) => {
    const o =
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {};
    const statusRaw = String(o.status ?? "admitted");
    const status = VALID_SCHOOL_STATUS.has(statusRaw as IntlSchoolStatus)
      ? (statusRaw as IntlSchoolStatus)
      : "admitted";
    return {
      id:
        typeof o.id === "string" && o.id
          ? o.id
          : `school-${i}-${Date.now()}`,
      universityInput: String(
        o.universityInput ?? o.univName ?? o.university ?? ""
      ).trim(),
      univId: typeof o.univId === "number" && !Number.isNaN(o.univId) ? o.univId : 0,
      status,
    };
  });

  return normalized.length > 0 ? normalized : [...base];
}

export function mergeIntlDraftFromStorage(
  parsed: Record<string, unknown>,
  empty: IntlFormDraft
): IntlFormDraft {
  const schools = normalizeIntlSchools(
    parsed.schools ?? parsed.schoolsApplied,
    empty.schools
  );

  let scoresText = typeof parsed.scoresText === "string" ? parsed.scoresText : "";
  let gpa = typeof parsed.gpa === "string" ? parsed.gpa : "";
  let gpaSystem =
    typeof parsed.gpaSystem === "string" ? parsed.gpaSystem : empty.gpaSystem;

  if (!scoresText && parsed.scores && typeof parsed.scores === "object") {
    const s = parsed.scores as Record<string, string>;
    const lines: string[] = [];
    const push = (label: string, v?: string) => {
      if (v?.trim()) lines.push(`${label}: ${v.trim()}`);
    };
    push("SAT", s.satTotal ?? s.sat);
    push("SAT breakdown", s.satBreakdown);
    push("ACT", s.act);
    push("IB", s.ibTotal ?? s.ib);
    push("IB detail", s.ibDetail);
    push("AP", s.ap);
    push("A-Level", s.aLevel);
    push("TOPIK", s.topik);
    push("TOEFL/IELTS", s.toeflIelts ?? s.toefl ?? s.ielts);
    scoresText = lines.join("\n");
    if (s.gpa?.trim()) gpa = s.gpa;
    if (s.gpaSystem?.trim()) gpaSystem = s.gpaSystem;
  }

  const narrativeRaw =
    parsed.narrative && typeof parsed.narrative === "object"
      ? (parsed.narrative as Partial<IntlFormDraft["narrative"]>)
      : {};

  const trackRaw = String(parsed.track ?? empty.track);
  const track = INTL_TRACK_OPTIONS.some((o) => o.value === trackRaw)
    ? (trackRaw as IntlAdmissionTrack)
    : empty.track;

  const degreeRaw = String(parsed.degreeLevel ?? parsed.degree_level ?? "");
  const degreeLevel = isDegreeLevel(degreeRaw)
    ? degreeRaw
    : empty.degreeLevel;

  return {
    ...empty,
    ...parsed,
    track,
    degreeLevel,
    trackOther: String(parsed.trackOther ?? "").trim(),
    handle: String(parsed.handle ?? parsed.displayName ?? "").trim(),
    year: String(parsed.year ?? parsed.yearAdmitted ?? "").trim(),
    nationalityCode: String(
      parsed.nationalityCode ?? parsed.nationality_code ?? ""
    )
      .trim()
      .toUpperCase(),
    gender: String(parsed.gender ?? "").trim(),
    hsCountry: String(parsed.hsCountry ?? parsed.homeCountry ?? "").trim(),
    highSchoolType: String(parsed.highSchoolType ?? "").trim(),
    schools,
    scoresText,
    gpa,
    gpaSystem,
    narrative: {
      ...empty.narrative,
      extracurriculars: String(
        narrativeRaw.extracurriculars ?? parsed.extracurriculars ?? ""
      ),
      essays: String(narrativeRaw.essays ?? parsed.essays ?? ""),
      interview: String(narrativeRaw.interview ?? parsed.interview ?? ""),
      tips: String(narrativeRaw.tips ?? parsed.tips ?? ""),
    },
    mentorOptIn: Boolean(
      parsed.mentorOptIn ??
        parsed.available_as_mentor ??
        false
    ),
    mentorIntro: String(
      parsed.mentorIntro ?? parsed.mentor_intro ?? ""
    ).trim(),
  };
}

export function parseKrUniversitiesResponse(data: unknown): Array<{
  name_kr: string;
  name_en?: string | null;
  id?: number;
}> {
  if (Array.isArray(data)) {
    return data as Array<{ name_kr: string; name_en?: string | null; id?: number }>;
  }
  if (data && typeof data === "object") {
    const u = (data as { universities?: unknown }).universities;
    if (Array.isArray(u)) {
      return u as Array<{
        name_kr: string;
        name_en?: string | null;
        id?: number;
      }>;
    }
  }
  return [];
}

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
