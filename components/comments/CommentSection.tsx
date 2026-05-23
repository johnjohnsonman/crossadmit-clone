"use client";

import { useCallback, useState } from "react";
import { Turnstile } from "@/components/Turnstile";
import { formatTimeAgo } from "@/lib/forum/post-display";
import type { ForumComment } from "@/lib/forum/comments";

type Props = {
  postId: string;
  initialComments: ForumComment[];
};

function CommentItem({
  comment,
  onReply,
  onDeleted,
}: {
  comment: ForumComment;
  onReply: (parentId: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteErr(null);
    try {
      const res = await fetch(`/api/comments/${comment.id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePw }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.reason || "Delete failed");
      }
      onDeleted(comment.id);
      setShowDelete(false);
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : "Error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="border-t border-[#EDEFF1] dark:border-[#343536] py-3 first:border-t-0">
      <div className="flex items-center gap-2 text-xs text-[#7C7C7C]">
        <span className="font-bold text-[#1C1C1C] dark:text-[#D7DADC]">
          {comment.anonymous_nickname}
        </span>
        <span>·</span>
        <span>{formatTimeAgo(comment.created_at)}</span>
      </div>
      <p className="mt-1 text-sm text-[#1C1C1C] dark:text-[#D7DADC] whitespace-pre-wrap">
        {comment.content}
      </p>
      <div className="mt-2 flex gap-3 text-xs font-bold text-[#7C7C7C]">
        <button
          type="button"
          className="hover:text-[#FF4500]"
          onClick={() => onReply(comment.id)}
        >
          Reply
        </button>
        <button
          type="button"
          className="hover:text-[#FF4500]"
          onClick={() => setShowDelete((v) => !v)}
        >
          Delete
        </button>
      </div>
      {showDelete && (
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit password"
            value={deletePw}
            onChange={(e) => setDeletePw(e.target.value.replace(/\D/g, ""))}
            className="w-28 px-2 py-1 text-sm border rounded border-[#EDEFF1]"
          />
          <button
            type="button"
            disabled={deleting || deletePw.length !== 4}
            onClick={() => void handleDelete()}
            className="px-3 py-1 text-xs font-bold bg-red-600 text-white rounded disabled:opacity-50"
          >
            Confirm
          </button>
          {deleteErr && (
            <span className="text-xs text-red-600">{deleteErr}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId, initialComments }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [nickname, setNickname] = useState("Anonymous");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (content.trim().length < 2) {
      setError("Comment must be at least 2 characters.");
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      setError("Enter your 4-digit password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          parent_id: parentId,
          nickname,
          password,
          content: content.trim(),
          turnstile_token: turnstileToken,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.reason || "Failed to post comment");
      }
      setComments((prev) => [...prev, json.comment as ForumComment]);
      setContent("");
      setParentId(null);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const roots = comments.filter((c) => !c.parent_id);
  const repliesByParent = comments.reduce(
    (acc, c) => {
      if (c.parent_id) {
        if (!acc[c.parent_id]) acc[c.parent_id] = [];
        acc[c.parent_id]!.push(c);
      }
      return acc;
    },
    {} as Record<string, ForumComment[]>
  );

  return (
    <section className="bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded p-4 sm:p-6">
      <h2 className="text-lg font-bold text-[#1C1C1C] dark:text-[#D7DADC] mb-4">
        Comments ({comments.length})
      </h2>

      <form onSubmit={(e) => void submit(e)} className="mb-6 space-y-3">
        {parentId && (
          <p className="text-xs text-[#FF4500] font-medium">
            Replying to comment ·{" "}
            <button
              type="button"
              className="underline"
              onClick={() => setParentId(null)}
            >
              Cancel
            </button>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-2 text-sm border border-[#EDEFF1] rounded"
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit PIN"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, ""))}
            className="w-28 px-3 py-2 text-sm border border-[#EDEFF1] rounded"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment (anonymous)…"
          rows={4}
          className="w-full px-3 py-2 text-sm border border-[#EDEFF1] rounded resize-y"
        />
        <Turnstile onVerify={onVerify} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post Comment"}
        </button>
      </form>

      <div>
        {roots.map((c) => (
          <div key={c.id}>
            <CommentItem
              comment={c}
              onReply={setParentId}
              onDeleted={(id) =>
                setComments((prev) => prev.filter((x) => x.id !== id))
              }
            />
            {(repliesByParent[c.id] ?? []).map((r) => (
              <div key={r.id} className="ml-6 pl-3 border-l-2 border-[#EDEFF1]">
                <CommentItem
                  comment={r}
                  onReply={setParentId}
                  onDeleted={(id) =>
                    setComments((prev) => prev.filter((x) => x.id !== id))
                  }
                />
              </div>
            ))}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-[#7C7C7C]">No comments yet. Be the first!</p>
        )}
      </div>
    </section>
  );
}
