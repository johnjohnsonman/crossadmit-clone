import type { AdmitTrack } from "@/lib/admissions/admit-track";

export type AdmissionTitleLocale = "ko" | "en";

export type GenerateAdmissionTitleInput = {
  year: number;
  universityName: string;
  departmentName?: string;
  admitTrack?: AdmitTrack | string;
  locale?: AdmissionTitleLocale;
};

function trackLabelEn(track: string): string {
  switch (track) {
    case "gks":
      return "GKS";
    case "overseas_kr":
      return "Overseas Korean track";
    case "international":
      return "International track";
    case "graduate":
      return "Graduate";
    case "abroad":
      return "Abroad";
    default:
      return "International track";
  }
}

/** International / EN listing title — Korean form uses inline title logic elsewhere. */
export function generateAdmissionTitle(
  input: GenerateAdmissionTitleInput
): string {
  const locale = input.locale ?? "en";
  const year = input.year;
  const univ = input.universityName.trim() || "University";
  const dept = input.departmentName?.trim();
  const track = String(input.admitTrack ?? "international");

  if (locale === "en") {
    const trackPart = trackLabelEn(track);
    return `${year} · ${univ} · ${trackPart}`;
  }

  const trackKo =
    track === "gks"
      ? "GKS"
      : track === "overseas_kr"
        ? "재외국민"
        : track === "graduate"
          ? "대학원"
          : "합격";
  if (dept) {
    return `${univ} ${dept} · ${year}년 ${trackKo} 후기`;
  }
  return `${univ} · ${year}년 ${trackKo} 후기`;
}
