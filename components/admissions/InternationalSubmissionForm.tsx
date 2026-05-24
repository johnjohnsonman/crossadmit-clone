"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AutocompleteInput, {
  type AutocompleteItem,
} from "@/components/AutocompleteInput";
import {
  buildIntlInputGpa,
  buildIntlInputScore,
  buildIntlSpecialty,
  buildIntlTitle,
  HS_COUNTRIES,
  INTL_DRAFT_STORAGE_KEY,
  INTL_TRACK_OPTIONS,
  intlStatusToKorean,
  trackToAdmitTrack,
  validateIntlSchools,
  type IntlAdmissionTrack,
  type IntlFormDraft,
  type IntlSchoolStatus,
} from "@/lib/admissions/intl-submission";
import { withLang } from "@/lib/i18n/locale";

const YEAR_OPTIONS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];
const STEPS = 4;

const inputClass =
  "mt-1 block w-full rounded-lg border border-[#E5E5E0] bg-white px-3 py-2 text-sm text-[#1A1A1A] shadow-sm " +
  "placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]";
const labelClass = "block text-sm font-medium text-[#1A1A1A]";

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
  hsCountry: "",
  schools: [newSchoolRow(), newSchoolRow()],
  scores: {
    satTotal: "",
    satBreakdown: "",
    act: "",
    ibTotal: "",
    ibDetail: "",
    ap: "",
    aLevel: "",
    topik: "",
    toeflIelts: "",
    gpa: "",
    gpaSystem: "4.0",
  },
  narrative: {
    extracurriculars: "",
    essays: "",
    interview: "",
    tips: "",
  },
};

export default function InternationalSubmissionForm() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<IntlFormDraft>(EMPTY_DRAFT);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: number; link: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INTL_DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as IntlFormDraft;
        setDraft({ ...EMPTY_DRAFT, ...parsed, scores: { ...EMPTY_DRAFT.scores, ...parsed.scores }, narrative: { ...EMPTY_DRAFT.narrative, ...parsed.narrative } });
        setStep(Math.min(Math.max(parsed.step ?? 1, 1), STEPS));
      }
    } catch {
      /* ignore */
    }
  }, []);

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

  const progressPct = Math.round((step / STEPS) * 100);

  const updateDraft = useCallback((patch: Partial<IntlFormDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  async function loadKrUniversities(q: string): Promise<AutocompleteItem[]> {
    const params = new URLSearchParams({ search: q.trim(), country: "kr" });
    try {
      const res = await fetch(`/api/universities?${params.toString()}`);
      const data = await res.json();
      return (data.universities ?? []).map(
        (u: { name_kr: string; name_en?: string }) => ({
          label: u.name_en?.trim() || u.name_kr,
          hint: u.name_kr !== u.name_en ? u.name_kr : undefined,
        })
      );
    } catch {
      return [];
    }
  }

  async function onUnivPick(rowId: string, name: string) {
    setDraft((d) => ({
      ...d,
      schools: d.schools.map((s) =>
        s.id === rowId ? { ...s, universityInput: name, univId: 0 } : s
      ),
    }));
    try {
      const res = await fetch(
        `/api/universities?search=${encodeURIComponent(name)}&country=kr`
      );
      const data = await res.json();
      const match = (data.universities ?? []).find(
        (u: { id: number; name_en: string; name_kr: string }) =>
          u.name_en === name ||
          u.name_kr === name ||
          `${u.name_en}` === name
      );
      if (match?.id) {
        setDraft((d) => ({
          ...d,
          schools: d.schools.map((s) =>
            s.id === rowId ? { ...s, univId: match.id } : s
          ),
        }));
      }
    } catch {
      /* name only */
    }
  }

  function setSchoolStatus(rowId: string, status: IntlSchoolStatus) {
    setDraft((d) => {
      if (status === "enrolled") {
        return {
          ...d,
          schools: d.schools.map((s) => ({
            ...s,
            status: s.id === rowId ? "enrolled" : s.status === "enrolled" ? "admitted" : s.status,
          })),
        };
      }
      return {
        ...d,
        schools: d.schools.map((s) =>
          s.id === rowId ? { ...s, status } : s
        ),
      };
    });
  }

  const filledSchools = useMemo(
    () => draft.schools.filter((s) => s.universityInput.trim()),
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
          track: draft.track,
          track_other: draft.trackOther.trim(),
          hs_country: draft.hsCountry,
          input_score: buildIntlInputScore(draft.scores),
          input_gpa: buildIntlInputGpa(draft.scores),
          input_specialty: buildIntlSpecialty(draft),
          verification_url: verificationUrl,
          is_verified: Boolean(verificationUrl),
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
      setSuccess({ id: data.id, link });
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
    <main className="min-h-screen bg-[#FAFAF8] pb-20 pt-10">
      <div className="container mx-auto max-w-2xl px-4">
        <Link
          href={withLang("/admissions", "en")}
          className="text-sm font-medium text-[#2D5A27] hover:underline"
        >
          ← Admissions DB
        </Link>

        <div className="mt-6 rounded-xl border border-[#E5E5E0] bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium text-[#2D5A27]">
            Step {step} of {STEPS}
          </p>
          <div className="mt-2 h-2 rounded-full bg-[#E5E5E0] overflow-hidden">
            <div
              className="h-full bg-[#2D5A27] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-[#1A1A1A]">
            Share your journey to Korean universities
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
            Your story helps the next generation of international students see
            realistic profiles and paths to study in Korea.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError}
              </div>
            )}

            {step === 1 && (
              <section className="space-y-5">
                <Micro
                  q="Why are you asking?"
                  a="To help other international students see realistic profiles."
                />
                <Micro
                  q="Anonymous is OK"
                  a="No real names required — use a nickname like “Maya from Vietnam”."
                />
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
                            updateDraft({ track: opt.value as IntlAdmissionTrack })
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
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  Universities applied to
                </h2>
                <p className="text-sm text-[#6B7280]">
                  Search Korean universities. Mark one as{" "}
                  <strong>Enrolled</strong> if you attended.
                </p>
                {draft.schools.map((row, idx) => (
                  <div
                    key={row.id}
                    className="rounded-lg border border-[#E5E5E0] p-3 space-y-2"
                  >
                    <label className={labelClass}>University {idx + 1}</label>
                    <AutocompleteInput
                      value={row.universityInput}
                      onChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          schools: d.schools.map((s) =>
                            s.id === row.id
                              ? { ...s, universityInput: v, univId: 0 }
                              : s
                          ),
                        }))
                      }
                      onSelect={(v) => void onUnivPick(row.id, v)}
                      loadOptions={loadKrUniversities}
                      placeholder="Search e.g. Seoul National University"
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
                    setDraft((d) => ({
                      ...d,
                      schools:
                        d.schools.length >= 10
                          ? d.schools
                          : [...d.schools, newSchoolRow()],
                    }))
                  }
                >
                  + Add another university
                </button>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-5">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  Scores & profile <span className="text-sm font-normal text-[#9CA3AF]">(all optional)</span>
                </h2>
                <ScoreField
                  label="SAT total"
                  value={draft.scores.satTotal}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      scores: { ...d.scores, satTotal: v },
                    }))
                  }
                />
                <ScoreField
                  label="SAT breakdown"
                  value={draft.scores.satBreakdown}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      scores: { ...d.scores, satBreakdown: v },
                    }))
                  }
                  placeholder="e.g. ERW 750, Math 770"
                />
                <ScoreField
                  label="ACT"
                  value={draft.scores.act}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, scores: { ...d.scores, act: v } }))
                  }
                />
                <ScoreField
                  label="IB total"
                  value={draft.scores.ibTotal}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      scores: { ...d.scores, ibTotal: v },
                    }))
                  }
                />
                <ScoreField
                  label="IB HL/SL detail"
                  value={draft.scores.ibDetail}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      scores: { ...d.scores, ibDetail: v },
                    }))
                  }
                />
                <ScoreField
                  label="AP scores"
                  value={draft.scores.ap}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, scores: { ...d.scores, ap: v } }))
                  }
                />
                <ScoreField
                  label="A-Level"
                  value={draft.scores.aLevel}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      scores: { ...d.scores, aLevel: v },
                    }))
                  }
                />
                <ScoreField
                  label="TOPIK level"
                  value={draft.scores.topik}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      scores: { ...d.scores, topik: v },
                    }))
                  }
                />
                <ScoreField
                  label="TOEFL / IELTS"
                  value={draft.scores.toeflIelts}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      scores: { ...d.scores, toeflIelts: v },
                    }))
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <ScoreField
                    label="High school GPA"
                    value={draft.scores.gpa}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        scores: { ...d.scores, gpa: v },
                      }))
                    }
                  />
                  <div>
                    <label className={labelClass}>GPA system</label>
                    <select
                      className={inputClass}
                      value={draft.scores.gpaSystem}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          scores: { ...d.scores, gpaSystem: e.target.value },
                        }))
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
                  Verification <span className="text-sm font-normal text-[#9CA3AF]">(optional)</span>
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
              </section>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
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
                  Continue
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
      <span className="font-semibold text-[#2D5A27]">{q}</span> → {a}
    </p>
  );
}

function ScoreField({
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
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        rows={3}
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
