"use client";

import { useState } from "react";

type Props = {
  postId: string;
};

export default function GuideFeedback({ postId }: Props) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  return (
    <div className="mt-6 pt-4 border-t border-[#EDEFF1] dark:border-[#343536]">
      <p className="text-sm font-semibold text-[#1C1C1C] dark:text-[#D7DADC] mb-2">
        Was this guide helpful?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setVote("up")}
          className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
            vote === "up"
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-white dark:bg-[#1A1A1B] border-[#EDEFF1] dark:border-[#343536] hover:bg-purple-50"
          }`}
          aria-pressed={vote === "up"}
        >
          👍 Yes
        </button>
        <button
          type="button"
          onClick={() => setVote("down")}
          className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
            vote === "down"
              ? "bg-slate-600 text-white border-slate-600"
              : "bg-white dark:bg-[#1A1A1B] border-[#EDEFF1] dark:border-[#343536] hover:bg-slate-50"
          }`}
          aria-pressed={vote === "down"}
        >
          👎 No
        </button>
      </div>
      {vote && (
        <p className="text-xs text-[#7C7C7C] mt-2">
          Thanks for your feedback.
          <span className="sr-only"> post {postId}</span>
        </p>
      )}
    </div>
  );
}
