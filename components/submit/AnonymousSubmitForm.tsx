"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import UniversityAutocomplete, {
  type UniversityPick,
} from "@/components/crossadmit/UniversityAutocomplete";
import { Turnstile } from "@/components/Turnstile";
import RedditLayout from "@/components/reddit-style/RedditLayout";

const CATEGORIES = [
  { value: "visa", label: "Visa" },
  { value: "admission", label: "Admission" },
  { value: "scholarship", label: "Scholarship" },
  { value: "dormitory", label: "Dormitory" },
  { value: "language", label: "Language" },
  { value: "employment", label: "Employment" },
  { value: "living_cost", label: "Life / Living cost" },
  { value: "culture", label: "Culture" },
  { value: "campus_life", label: "Campus" },
  { value: "settlement", label: "Settlement" },
];

export default function AnonymousSubmitForm() {
  const router = useRouter();
  const [category, setCategory] = useState("visa");
  const [univSearch, setUnivSearch] = useState("");
  const [univ, setUniv] = useState<UniversityPick | null>(null);
  const [nickname, setNickname] = useState("Anonymous");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<"en" | "ko">("en");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError("Title must be at least 5 characters.");
      return;
    }
    if (content.trim().length < 30) {
      setError("Content must be at least 30 characters.");
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      setError("Password must be exactly 4 digits (for edit/delete).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          university: univ?.name_en || univ?.name_kr || univSearch,
          university_id: univ?.id ?? null,
          nickname,
          password,
          title,
          content,
          language,
          auto_translate: autoTranslate,
          turnstile_token: turnstileToken,
        }),
      });
      const text = await res.text();
      let json: { success?: boolean; reason?: string; redirect?: string };
      try {
        json = JSON.parse(text) as typeof json;
      } catch {
        throw new Error(`Invalid response: ${text.slice(0, 80)}`);
      }
      if (!res.ok || !json.success) {
        throw new Error(json.reason || "Submit failed");
      }
      router.push(json.redirect || "/forum");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RedditLayout>
      <div className="max-w-xl mx-auto bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded-lg p-6">
        <h1 className="text-xl font-bold text-[#1C1C1C] dark:text-[#D7DADC]">
          Create a Post (no signup needed)
        </h1>
        <p className="text-sm text-[#7C7C7C] mt-1 mb-6">
          Share tips for international students in Korea. Anonymous posting.
        </p>

        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <label className="block text-sm font-medium">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-[#EDEFF1] rounded text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            University (optional)
            <UniversityAutocomplete
              value={univSearch}
              univId={univ?.id ?? null}
              onChange={setUnivSearch}
              onSelect={(u) => {
                setUniv(u);
                setUnivSearch(u.name_en || u.name_kr);
              }}
              onClearId={() => setUniv(null)}
              placeholder="Search university…"
              locale="en"
              className="mt-1 w-full px-3 py-2 text-sm border border-[#EDEFF1] rounded"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <label className="flex-1 text-sm font-medium">
              Nickname
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[#EDEFF1] rounded text-sm"
              />
            </label>
            <label className="w-32 text-sm font-medium">
              Password (4 digits)
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="mt-1 w-full px-3 py-2 border border-[#EDEFF1] rounded text-sm"
              />
            </label>
          </div>

          <label className="block text-sm font-medium">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-[#EDEFF1] rounded text-sm"
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Content
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="mt-1 w-full px-3 py-2 border border-[#EDEFF1] rounded text-sm resize-y"
              required
            />
          </label>

          <fieldset className="text-sm">
            <legend className="font-medium mb-2">Language</legend>
            <label className="inline-flex items-center gap-2 mr-4">
              <input
                type="radio"
                checked={language === "en"}
                onChange={() => setLanguage("en")}
              />
              English
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={language === "ko"}
                onChange={() => setLanguage("ko")}
              />
              Korean
            </label>
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
            />
            Auto-translate to other language
          </label>

          <Turnstile onVerify={onVerify} />

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#FF4500] text-white font-bold rounded-full hover:bg-[#e03d00] disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post Anonymously"}
          </button>
        </form>

        <p className="mt-4 text-xs text-[#7C7C7C] text-center">
          This is anonymous. Be respectful and helpful. Save your 4-digit
          password to delete your post later.
        </p>
      </div>
    </RedditLayout>
  );
}
