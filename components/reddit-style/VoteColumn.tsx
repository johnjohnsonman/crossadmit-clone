"use client";

import { useState } from "react";

type Props = {
  score: number;
  layout?: "side" | "bottom";
};

export default function VoteColumn({ score, layout = "side" }: Props) {
  const [vote, setVote] = useState<1 | -1 | 0>(0);
  const display = score + (vote === 1 ? 1 : vote === -1 ? -1 : 0);

  const btn =
    "p-1 rounded hover:bg-[#EDEFF1] dark:hover:bg-[#343536] transition-colors";

  const wrap =
    layout === "side"
      ? "flex flex-col items-center gap-0.5 w-10 shrink-0 pt-1"
      : "flex flex-row items-center gap-2 mt-3 md:hidden";

  return (
    <div className={wrap}>
      <button
        type="button"
        aria-label="Upvote"
        className={`${btn} ${vote === 1 ? "text-[#FF4500]" : "text-[#7C7C7C]"}`}
        onClick={() => setVote(vote === 1 ? 0 : 1)}
      >
        ▲
      </button>
      <span
        className={`text-xs font-bold tabular-nums ${
          vote === 1
            ? "text-[#FF4500]"
            : vote === -1
              ? "text-[#7193FF]"
              : "text-[#1C1C1C] dark:text-[#D7DADC]"
        }`}
      >
        {display}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        className={`${btn} ${vote === -1 ? "text-[#7193FF]" : "text-[#7C7C7C]"}`}
        onClick={() => setVote(vote === -1 ? 0 : -1)}
      >
        ▼
      </button>
    </div>
  );
}
