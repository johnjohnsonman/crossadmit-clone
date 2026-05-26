"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AutocompleteInput, {
  type AutocompleteItem,
} from "@/components/AutocompleteInput";
import type { DegreeLevel } from "@/lib/admissions/degree-level";
import {
  buildIntlInputGpa,
  buildIntlInputScore,
  buildIntlSpecialty,
  HS_COUNTRIES,
  HS_SCHOOL_TYPES,
  INTL_DRAFT_STORAGE_KEY,
  INTL_TRACK_OPTIONS,
  intlStatusToKorean,
  mergeIntlDraftFromStorage,
  parseKrUniversitiesResponse,
  STEP_MICROCOPY,
  trackToAdmitTrack,
  validateIntlSchools,
  type IntlAdmissionTrack,
  type IntlFormDraft,
  type IntlSchoolStatus,
} from "@/lib/admissions/intl-submission";
import {
  FILTERABLE_NATIONALITIES,
  GENDER_OPTIONS,
  getNationality,
} from "@/lib/i18n/nationalities";
import { withLang } from "@/lib/i18n/locale";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 2000 + 1 },
  (_, i) => String(CURRENT_YEAR - i)
);
const STEPS = 4;

const SCORES_PLACEHOLDER = `Examples (free format):
SAT 1480 (ERW 720, Math 760)
ACT 32
IB 38 — HL Math AA 7, HL Physics 6
AP: Calc BC 5, Physics C 5
TOPIK II Level 4
TOEFL 105 / IELTS 7.5`;

const inputClass =
  "mt-1 block w-full rounded-lg border border-[#E5E5E0] bg-white px-3 py-2 text-sm text-[#1A1A1A] shadow-sm " +
  "placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]";
const labelClass = "block text-sm font-medium text-[#1A1A1A]";

const intlNationalityOptions: AutocompleteItem[] = FILTERABLE_NATIONALITIES.map((item) => ({
  label: `${item.flag} ${item.name_en}`,
  hint: `${item.name_ko} · ${item.code}`,
}));

function matchNationalityInput(raw: string) {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return undefined;
  return FILTERABLE_NATIONALITIES.find((item) => {
    const values = [
      item.code,
      item.name_ko,
      item.name_en,
      `${item.flag} ${item.name_ko}`,
      `${item.flag} ${item.name_en}`,
    ];
    return values.some((value) => value.trim().toLowerCase() === normalized);
  });
}

function formatNationalityInput(code: string): string {
  const nationality = getNationality(code);
  if (!nationality || nationality.code === "PREFER_NOT") return "";
  return `${nationality.flag} ${nationality.name_en}`;
}

function newSchoolRow(): IntlFormDraft["schools"][0] {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    universityInput: "",
    univId: 0,
    status: "admitted",
  };
}

const EMPTY_DRAFT: IntlFormDraft = {
  step: 1,
  handle: "",
  year: "",
  track: "international",
  trackOther: "",
  degreeLevel: "undergraduate",
  nationalityCode: "",
  gender: "",
  hsCountry: "",
  highSchoolType: "",
  schools: [newSchoolRow(), newSchoolRow()],
  scoresText: "",
  gpa: "",
  gpaSystem: "4.0",
  narrative: {
    extracurriculars: "",
    essays: "",
    interview: "",
    tips: "",
  },
  mentorOptIn: false,
  mentorIntro: "",
};

export default function InternationalSubmissionForm() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<IntlFormDraft>(EMPTY_DRAFT);
  const [nationalityInput, setNationalityInput] = useState("");
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    id: number;
    link: string;
    mentorOptIn: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INTL_DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        setDraft(mergeIntlDraftFromStorage(parsed, EMPTY_DRAFT));
        const stepNum =
          typeof parsed.step === "number"
            ? parsed.step
            : parseInt(String(parsed.step ?? "1"), 10);
        setStep(Math.min(Math.max(stepNum || 1, 1), STEPS));
      }
    } catch (e) {
      console.warn("Draft restore failed:", e);
    }
  }, []);

  useEffect(() => {
    const formatted = formatNationalityInput(draft.nationalityCode);
    if (formatted && !nationalityInput) {
      setNationalityInput(formatted);
    }
  }, [draft.nationalityCode, nationalityInput]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(
          INTL_DRAFT_STORAGE_KEY,
          JSON.stringify({ ...draft, step })
        );
      } catch {
        /* quota */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [draft, step]);

  const micro = STEP_MICROCOPY[step];

  const updateDraft = useCallback((patch: Partial<IntlFormDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  async function loadKrUniversities(q: string): Promise<AutocompleteItem[]> {
    const params = new URLSearchParams({ search: q.trim(), country: "kr" });
    try {
      const res = await fetch(`/api/universities?${params.toString()}`);
      const data = await res.json();
      return parseKrUniversitiesResponse(data).map((u) => ({
        label: u.name_en?.trim() || u.name_kr,
        hint: u.name_kr !== u.name_en ? u.name_kr : undefined,
      }));
    } catch {
      return [];
    }
  }

  async function onUnivPick(rowId: string, name: string) {
    setDraft((d) => ({
      ...d,
      schools: (d.schools ?? []).map((s) =>
        s.id === rowId ? { ...s, universityInput: name, univId: 0 } : s
      ),
    }));
    try {
      const res = await fetch(
        `/api/universities?search=${encodeURIComponent(name)}&country=kr`
      );
      const data = await res.json();
      const list = parseKrUniversitiesResponse(data);
      const match = list.find(
        (u) =>
          u.name_en === name ||
          u.name_kr === name ||
          `${u.name_en}` === name
      );
      if (match?.id) {
        setDraft((d) => ({
          ...d,
          schools: (d.schools ?? []).map((s) =>
            s.id === rowId ? { ...s, univId: match.id! } : s
          ),
        }));
      }
    } catch {
      /* name only */
    }
  }

  function setSchoolStatus(rowId: string, status: IntlSchoolStatus) {
    setDraft((d) => {
      const rows = d.schools ?? [];
      if (status === "enrolled") {
        return {
          ...d,
          schools: rows.map((s) => ({
            ...s,
            status:
              s.id === rowId
                ? "enrolled"
                : s.status === "enrolled"
                  ? "admitted"
                  : s.status,
          })),
        };
      }
      return {
        ...d,
        schools: rows.map((s) =>
          s.id === rowId ? { ...s, status } : s
        ),
      };
    });
  }

  const filledSchools = useMemo(
    () => (draft.schools ?? []).filter((s) => s.universityInput.trim()),
    [draft.schools]
  );

  const schoolsForSubmit = useMemo(() => {
    return filledSchools.map((s) => ({
      univ_id: s.univId > 0 ? s.univId : undefined,
      univ_name: s.universityInput.trim(),
      dept_name: "General",
      status: intlStatusToKorean(s.status),
    }));
  }, [filledSchools]);

  function validateStep(n: number): string | null {
    if (n === 1) {
      if (!draft.year) return "Please select your admission year.";
      if (draft.track === "other" && !draft.trackOther.trim())
        return "Please describe your admission track.";
      if (!draft.hsCountry) return "Please select your high school country.";
      if (!draft.highSchoolType)
        return "Please select your high school type.";
    }
    if (n === 2) {
      if (schoolsForSubmit.length === 0)
        return "Add at least one Korean university you applied to.";
      const v = validateIntlSchools(filledSchools);
      if (!v.ok) return v.error;
    }
    return null;
  }

  function nextStep() {
    const err = validateStep(step);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setStep((s) => Math.min(STEPS, s + 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    for (let i = 1; i <= 2; i++) {
      const err = validateStep(i);
      if (err) {
        setFormError(err);
        setStep(i);
        return;
      }
    }

    setSubmitting(true);
    setFormError(null);
    try {
      let verificationUrl: string | undefined;
      if (verificationFile) {
        const fd = new FormData();
        fd.append("file", verificationFile);
        const up = await fetch("/api/admissions/verify-upload", {
          method: "POST",
          body: fd,
        });
        const upJson = await up.json();
        if (up.ok && upJson.url) {
          verificationUrl = upJson.url as string;
        }
      }

      const res = await fetch("/api/admissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: "intl",
          schools: schoolsForSubmit,
          year: parseInt(draft.year, 10),
          nickname: draft.handle.trim(),
          admit_track: trackToAdmitTrack(draft.track, draft.trackOther),
          degree_level: draft.degreeLevel,
          nationality_code: draft.nationalityCode || undefined,
          gender: draft.gender || undefined,
          track: draft.track,
          track_other: draft.trackOther.trim(),
          home_country: draft.hsCountry,
          high_school_type: draft.highSchoolType,
          hs_country: draft.hsCountry,
          input_score: buildIntlInputScore(draft),
          input_gpa: buildIntlInputGpa(draft),
          input_specialty: buildIntlSpecialty(draft),
          verification_url: verificationUrl,
          is_verified: Boolean(verificationUrl),
          available_as_mentor: draft.mentorOptIn,
          mentor_intro: draft.mentorIntro.trim(),
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        id?: number;
      };
      if (!res.ok || !data.success || !data.id) {
        setFormError(data.error ?? "Submission failed. Please try again.");
        return;
      }

      localStorage.removeItem(INTL_DRAFT_STORAGE_KEY);
      const link = `${window.location.origin}${withLang(`/admissions/${data.id}`, "en")}`;
      setSuccess({
        id: data.id,
        link,
        mentorOptIn: draft.mentorOptIn,
      });
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] py-12">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="rounded-xl border border-[#E5E5E0] bg-white p-8 shadow-sm">
            <p className="text-xl font-bold text-[#1A1A1A]">
              Thanks! Your story is now live.
            </p>
            <p className="mt-3 text-sm text-[#6B7280]">
              Share with the #StudyInKorea community — your experience helps the
              next generation of international students.
            </p>
            {success.mentorOptIn ? (
              <div className="mt-4 rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/5 px-4 py-3 text-left text-sm text-[#1A1A1A]">
                <p className="font-semibold text-[#2D5A27]">
                  🤝 You&apos;re now listed on the Mentors page!
                </p>
                <p className="mt-1 text-[#6B7280]">
                  Future applicants will reach you through your story&apos;s
                  comments.
                </p>
                <Link
                  href={withLang("/mentors", "en")}
                  className="mt-2 inline-block font-medium text-[#2D5A27] hover:underline"
                >
                  View Mentors page →
                </Link>
              </div>
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              <input
                readOnly
                value={success.link}
                className="w-full rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] px-3 py-2 text-xs text-[#6B7280]"
              />
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(success.link);
                  setCopied(true);
                }}
                className="rounded-lg bg-[#2D5A27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#244a20]"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
              <Link
                href={withLang("/admissions", "en")}
                className="text-sm font-medium text-[#2D5A27] hover:underline"
              >
                View Admissions DB →
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] pb-24">
      <div className="sticky top-0 z-30 border-b border-[#E5E5E0] bg-[#FAFAF8]/95 backdrop-blur">
        <div className="container mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-sm tracking-widest text-[#2D5A27]">
              {Array.from({ length: STEPS }, (_, i) => (
                <span
                  key={i}
                  className={
                    i + 1 <= step ? "text-[#2D5A27]" : "text-[#D1D5DB]"
                  }
                  aria-hidden
                >
                  {i + 1 <= step ? "●" : "○"}
                </span>
              ))}
            </div>
            <p className="text-sm font-medium text-[#6B7280]">
              Step {step} of {STEPS}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-8">
        <Link
          href={withLang("/admissions", "en")}
          className="text-sm font-medium text-[#2D5A27] hover:underline"
        >
          ← Admissions DB
        </Link>

        <div className="mt-6 rounded-xl border border-[#E5E5E0] bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            Share your journey to Korean universities
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
            Your story helps the next generation of international students see
            realistic profiles and paths to study in Korea.
          </p>

          {micro && (
            <div className="mt-4 space-y-2">
              <Micro q="Why do we ask?" a={micro.why} />
              <Micro q="Anonymous is OK." a={micro.anon} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError}
              </div>
            )}

            {step === 1 && (
              <section className="space-y-5">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  {micro?.title ?? "About you"}
                </h2>
                <div>
                  <label className={labelClass} htmlFor="handle">
                    Anonymous handle{" "}
                    <span className="font-normal text-[#9CA3AF]">(optional)</span>
                  </label>
                  <input
                    id="handle"
                    className={inputClass}
                    placeholder="e.g., Maya from Vietnam"
                    value={draft.handle}
                    onChange={(e) => updateDraft({ handle: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="year">
                    Year admitted <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="year"
                    className={inputClass}
                    value={draft.year}
                    onChange={(e) => updateDraft({ year: e.target.value })}
                  >
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <fieldset>
                  <legend className={labelClass}>
                    Admission track <span className="text-red-600">*</span>
                  </legend>
                  <div className="mt-2 space-y-2">
                    {INTL_TRACK_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#E5E5E0] px-3 py-2 hover:border-[#2D5A27]"
                      >
                        <input
                          type="radio"
                          name="track"
                          className="mt-1"
                          checked={draft.track === opt.value}
                          onChange={() =>
                            updateDraft({
                              track: opt.value as IntlAdmissionTrack,
                            })
                          }
                        />
                        <span className="text-sm text-[#1A1A1A]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {draft.track === "other" && (
                    <input
                      className={`${inputClass} mt-2`}
                      placeholder="Please specify"
                      value={draft.trackOther}
                      onChange={(e) =>
                        updateDraft({ trackOther: e.target.value })
                      }
                    />
                  )}
                </fieldset>
                <fieldset>
                  <legend className={labelClass}>
                    Degree level <span className="text-red-600">*</span>
                  </legend>
                  <div className="mt-2 space-y-2">
                    {(
                      [
                        {
                          value: "undergraduate" as DegreeLevel,
                          label: "Undergraduate (Bachelor's)",
                        },
                        {
                          value: "graduate" as DegreeLevel,
                          label: "Graduate (Master's or PhD)",
                        },
                        { value: "mba" as DegreeLevel, label: "MBA" },
                        {
                          value: "law" as DegreeLevel,
                          label: "Law school",
                        },
                      ] as const
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#E5E5E0] px-3 py-2 hover:border-[#2D5A27]"
                      >
                        <input
                          type="radio"
                          name="degreeLevel"
                          className="mt-1"
                          checked={draft.degreeLevel === opt.value}
                          onChange={() =>
                            updateDraft({ degreeLevel: opt.value })
                          }
                        />
                        <span className="text-sm text-[#1A1A1A]">
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label className={labelClass} htmlFor="hsCountry">
                    Country of high school <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="hsCountry"
                    className={inputClass}
                    value={draft.hsCountry}
                    onChange={(e) => updateDraft({ hsCountry: e.target.value })}
                  >
                    <option value="">Select country</option>
                    {HS_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="hsType">
                    High school type <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="hsType"
                    className={inputClass}
                    value={draft.highSchoolType}
                    onChange={(e) =>
                      updateDraft({ highSchoolType: e.target.value })
                    }
                  >
                    <option value="">Select type</option>
                    {HS_SCHOOL_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  {micro?.title ?? "Universities"}
                </h2>
                <p className="text-sm text-[#6B7280]">
                  Search Korean universities only. Mark one as{" "}
                  <strong>Enrolled</strong> if you attended.
                </p>
                {(draft.schools ?? []).map((row, idx) => (
                  <div
                    key={row.id}
                    className="rounded-lg border border-[#E5E5E0] p-3 space-y-2"
                  >
                    <label className={labelClass}>University {idx + 1}</label>
                    <AutocompleteInput
                      options={[]}
                      value={row.universityInput}
                      onChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          schools: (d.schools ?? []).map((s) =>
                            s.id === row.id
                              ? { ...s, universityInput: v, univId: 0 }
                              : s
                          ),
                        }))
                      }
                      onSelect={(v) => void onUnivPick(row.id, v)}
                      loadOptions={loadKrUniversities}
                      placeholder="e.g. Seoul National University"
                      className={inputClass}
                    />
                    <select
                      className={inputClass}
                      value={row.status}
                      onChange={(e) =>
                        setSchoolStatus(
                          row.id,
                          e.target.value as IntlSchoolStatus
                        )
                      }
                    >
                      <option value="admitted">Admitted</option>
                      <option value="waitlisted">Waitlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="enrolled">Enrolled</option>
                    </select>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm font-medium text-[#2D5A27] hover:underline"
                  onClick={() =>
                    setDraft((d) => {
                      const rows = d.schools ?? [];
                      return {
                        ...d,
                        schools:
                          rows.length >= 10
                            ? rows
                            : [...rows, newSchoolRow()],
                      };
                    })
                  }
                >
                  + Add another university
                </button>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-5">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  {micro?.title ?? "Profile & scores"}{" "}
                  <span className="text-sm font-normal text-[#9CA3AF]">
                    (optional)
                  </span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="nationalityCode">
                      Nationality (optional)
                    </label>
                    <AutocompleteInput
                      id="nationalityCode"
                      options={intlNationalityOptions}
                      value={nationalityInput}
                      onChange={(value) => {
                        setNationalityInput(value);
                        updateDraft({
                          nationalityCode: matchNationalityInput(value)?.code ?? "",
                        });
                      }}
                      onSelect={(value) => {
                        setNationalityInput(value);
                        updateDraft({
                          nationalityCode: matchNationalityInput(value)?.code ?? "",
                        });
                      }}
                      placeholder="Search nationality"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="gender">
                      Gender (optional)
                    </label>
                    <select
                      id="gender"
                      className={inputClass}
                      value={draft.gender}
                      onChange={(e) => updateDraft({ gender: e.target.value })}
                    >
                      <option value="">Prefer not to choose</option>
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] px-3 py-2 text-xs text-[#6B7280]">
                  This helps other students find admissions stories from people
                  with similar backgrounds. It is optional and can be changed
                  later.
                </p>
                <div>
                  <label className={labelClass} htmlFor="scoresText">
                    Test scores & qualifications
                  </label>
                  <textarea
                    id="scoresText"
                    rows={8}
                    className={inputClass}
                    placeholder={SCORES_PLACEHOLDER}
                    value={draft.scoresText}
                    onChange={(e) =>
                      updateDraft({ scoresText: e.target.value })
                    }
                  />
                  <p className="mt-1 text-xs text-[#9CA3AF]">
                    Write in any format — English recommended for the public
                    listing.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="gpa">
                      High school GPA
                    </label>
                    <input
                      id="gpa"
                      className={inputClass}
                      placeholder="e.g. 3.85"
                      value={draft.gpa}
                      onChange={(e) => updateDraft({ gpa: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="gpaSystem">
                      GPA system
                    </label>
                    <select
                      id="gpaSystem"
                      className={inputClass}
                      value={draft.gpaSystem}
                      onChange={(e) =>
                        updateDraft({ gpaSystem: e.target.value })
                      }
                    >
                      <option value="4.0">4.0 scale</option>
                      <option value="5.0">5.0 scale</option>
                      <option value="IB">IB</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <TextArea
                  label="Extracurriculars & achievements"
                  placeholder="e.g. Model UN, robotics club captain"
                  value={draft.narrative.extracurriculars}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      narrative: { ...d.narrative, extracurriculars: v },
                    }))
                  }
                />
                <TextArea
                  label="Essay topics (themes only, not full essays)"
                  placeholder="e.g. Why Korea, leadership experience"
                  value={draft.narrative.essays}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      narrative: { ...d.narrative, essays: v },
                    }))
                  }
                />
                <TextArea
                  label="Interview experience"
                  placeholder="e.g. Video interview in English, 20 min"
                  value={draft.narrative.interview}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      narrative: { ...d.narrative, interview: v },
                    }))
                  }
                />
                <TextArea
                  label="Tips for international applicants"
                  placeholder="e.g. Start TOPIK early, contact current students"
                  value={draft.narrative.tips}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      narrative: { ...d.narrative, tips: v },
                    }))
                  }
                />
              </section>
            )}

            {step === 4 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  {micro?.title ?? "Verification"}{" "}
                  <span className="text-sm font-normal text-[#9CA3AF]">
                    (optional)
                  </span>
                </h2>
                <p className="text-sm text-[#6B7280]">
                  Upload a screenshot of your admission letter. Verified stories
                  show a badge on the Admissions DB.
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="block w-full text-sm text-[#6B7280]"
                  onChange={(e) =>
                    setVerificationFile(e.target.files?.[0] ?? null)
                  }
                />

                <div className="mt-6 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] p-4 space-y-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={draft.mentorOptIn}
                      onChange={(e) =>
                        updateDraft({ mentorOptIn: e.target.checked })
                      }
                    />
                    <span className="text-sm text-[#1A1A1A]">
                      <span className="font-semibold">
                        I&apos;m open to helping future applicants
                      </span>
                      <span className="block mt-1 text-[#6B7280]">
                        List me on the Mentors page instantly (no admin review).
                        Others can ask questions in your story comments.
                      </span>
                    </span>
                  </label>
                  {draft.mentorOptIn ? (
                    <div>
                      <label className={labelClass} htmlFor="mentorIntro">
                        Short message for mentees{" "}
                        <span className="font-normal text-[#9CA3AF]">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        id="mentorIntro"
                        rows={3}
                        className={inputClass}
                        placeholder="e.g. Happy to answer questions about GKS essays and TOPIK prep."
                        value={draft.mentorIntro}
                        onChange={(e) =>
                          updateDraft({ mentorIntro: e.target.value })
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            )}

            <div className="flex flex-wrap gap-3 pt-2 border-t border-[#E5E5E0]">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setStep((s) => s - 1);
                  }}
                  className="rounded-lg border border-[#E5E5E0] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FAFAF8]"
                >
                  Back
                </button>
              )}
              {step < STEPS ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 rounded-lg bg-[#2D5A27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#244a20]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-[#2D5A27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#244a20] disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit my story"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Micro({ q, a }: { q: string; a: string }) {
  return (
    <p className="text-xs text-[#6B7280] rounded-lg bg-[#FAFAF8] border border-[#E5E5E0] px-3 py-2">
      <span className="font-semibold text-[#2D5A27]">{q}</span> {a}
    </p>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        rows={3}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
