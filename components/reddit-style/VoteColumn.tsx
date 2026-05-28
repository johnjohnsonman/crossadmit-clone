"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  postId: string;
  score: number;
  layout?: "side" | "bottom";
};

type VoteValue = 1 | -1 | 0;

export default function VoteColumn({ postId, score, layout = "side" }: Props) {
  const storageKey = useMemo(() => `forum_vote:${postId}`, [postId]);
  const [vote, setVote] = useState<VoteValue>(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === "1" || raw === "-1" || raw === "0") {
        setVote(Number(raw) as VoteValue);
      }
    } catch {
      // ignore localStorage errors
    }
  }, [storageKey]);

  const display = score + (vote === 1 ? 1 : vote === -1 ? -1 : 0);

  const btn =
    "p-1 rounded hover:bg-[#EDEFF1] dark:hover:bg-[#343536] transition-colors";

  const wrap =
    layout === "side"
      ? "flex flex-col items-center gap-0.5 w-10 shrink-0 pt-1"
      : "flex flex-row items-center gap-2 mt-3 md:hidden";

  async function sendVote(next: VoteValue) {
    if (pending) return;
    const prev = vote;
    setVote(next);
    setPending(true);
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: next, prev_vote: prev }),
      });
      const json = (await res.json()) as { success?: boolean };
      if (!res.ok || !json.success) {
        throw new Error("Vote failed");
      }
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore localStorage errors
      }
    } catch {
      setVote(prev);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={wrap}>
      <button
        type="button"
        aria-label="Upvote"
        disabled={pending}
        className={`${btn} ${vote === 1 ? "text-[#FF4500]" : "text-[#7C7C7C]"}`}
        onClick={() => void sendVote(vote === 1 ? 0 : 1)}
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
        disabled={pending}
        className={`${btn} ${vote === -1 ? "text-[#7193FF]" : "text-[#7C7C7C]"}`}
        onClick={() => void sendVote(vote === -1 ? 0 : -1)}
      >
        ▼
      </button>
    </div>
  );
}
