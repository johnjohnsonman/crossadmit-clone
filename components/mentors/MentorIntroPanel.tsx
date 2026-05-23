"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Locale } from "@/lib/i18n/dictionary";

type Props = {
  introKr: string;
  introEn: string | null;
  locale?: Locale;
};

export default function MentorIntroPanel({
  introKr,
  introEn,
  locale: initialLocale = "ko",
}: Props) {
  const [lang, setLang] = useState<"kr" | "en">(
    initialLocale === "en" ? "en" : "kr"
  );

  const showEn = lang === "en";
  const content = showEn ? introEn : introKr;

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-[#1C1C1C] dark:text-[#D7DADC]">
          Self Introduction
        </h2>
        <button
          type="button"
          onClick={() => setLang("kr")}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            lang === "kr"
              ? "bg-orange-500 text-white border-orange-500"
              : "border-[#EDEFF1] dark:border-[#343536] text-[#7C7C7C] dark:text-[#818384]"
          }`}
        >
          한국어
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            lang === "en"
              ? "bg-orange-500 text-white border-orange-500"
              : "border-[#EDEFF1] dark:border-[#343536] text-[#7C7C7C] dark:text-[#818384]"
          }`}
        >
          English
        </button>
      </div>

      {showEn && !introEn ? (
        <p className="text-sm text-[#7C7C7C] italic py-4">
          English translation coming soon.
        </p>
      ) : (
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-[#1C1C1C] dark:prose-headings:text-[#D7DADC] prose-p:text-[#1C1C1C] dark:prose-p:text-[#D7DADC]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ""}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}
