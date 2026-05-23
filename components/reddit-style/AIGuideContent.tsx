"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  contentEn: string;
  contentKr?: string | null;
};

export default function AIGuideContent({ contentEn, contentKr }: Props) {
  const hasKr = Boolean(contentKr?.trim());
  const [lang, setLang] = useState<"en" | "kr">("en");

  const markdown = lang === "kr" && hasKr ? contentKr!.trim() : contentEn.trim();

  if (!markdown) {
    return (
      <p className="text-[#7C7C7C] dark:text-[#818384] italic">
        No content available.
      </p>
    );
  }

  return (
    <div>
      {hasKr && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-[#7C7C7C] dark:text-[#818384]">
            Language:
          </span>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              lang === "en"
                ? "bg-[#1C1C1C] dark:bg-[#D7DADC] text-white dark:text-[#1A1A1B] border-transparent"
                : "bg-white dark:bg-[#1A1A1B] border-[#EDEFF1] dark:border-[#343536] text-[#1C1C1C] dark:text-[#D7DADC] hover:bg-[#EDEFF1] dark:hover:bg-[#343536]"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang("kr")}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              lang === "kr"
                ? "bg-[#1C1C1C] dark:bg-[#D7DADC] text-white dark:text-[#1A1A1B] border-transparent"
                : "bg-white dark:bg-[#1A1A1B] border-[#EDEFF1] dark:border-[#343536] text-[#1C1C1C] dark:text-[#D7DADC] hover:bg-[#EDEFF1] dark:hover:bg-[#343536]"
            }`}
          >
            한국어
          </button>
        </div>
      )}

      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-[#1C1C1C] dark:prose-headings:text-[#D7DADC] prose-p:text-[#1C1C1C] dark:prose-p:text-[#D7DADC] prose-li:text-[#1C1C1C] dark:prose-li:text-[#D7DADC] prose-strong:text-[#1C1C1C] dark:prose-strong:text-[#D7DADC] prose-a:text-[#FF4500] hover:prose-a:underline">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF4500] font-medium hover:underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
