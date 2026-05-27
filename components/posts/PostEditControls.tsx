"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PasswordPromptModal from "./PasswordPromptModal";

type Props = {
  postId: string;
  category: string;
  initialIsAdmin?: boolean;
};

type ModalMode = "edit" | "delete" | null;

export default function PostEditControls({
  postId,
  category,
  initialIsAdmin = false,
}: Props) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [modal, setModal] = useState<ModalMode>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialIsAdmin) return;
    void fetch("/api/admin/session")
      .then((r) => r.json())
      .then((j: { isAdmin?: boolean }) => {
        if (j.isAdmin) setIsAdmin(true);
      })
      .catch(() => {});
  }, [initialIsAdmin]);

  const authorize = useCallback(
    async (password: string): Promise<string | null> => {
      const res = await fetch(`/api/posts/${postId}/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isAdmin ? {} : { password }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        edit_token?: string;
        reason?: string;
      };
      if (!res.ok || !json.success || !json.edit_token) {
        throw new Error(json.reason || "Authorization failed");
      }
      return json.edit_token;
    },
    [postId, isAdmin]
  );

  const handleEdit = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = await authorize(password);
      router.push(`/submit/edit/${postId}?token=${encodeURIComponent(token!)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  };

  const handleDelete = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = await authorize(password);
      const res = await fetch(`/api/posts/${postId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edit_token: token }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        redirect?: string;
        reason?: string;
      };
      if (!res.ok || !json.success) {
        throw new Error(json.reason || "Delete failed");
      }
      router.push(json.redirect || `/r/${category}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  };

  const adminSuffix = isAdmin ? " (admin)" : "";

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setModal("edit");
          }}
          className="px-3 py-1.5 text-xs font-bold rounded-full border border-[#EDEFF1] dark:border-[#343536] text-[#1C1C1C] dark:text-[#D7DADC] hover:bg-[#F6F7F8] dark:hover:bg-[#272729]"
        >
          Edit{adminSuffix}
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setModal("delete");
          }}
          className="px-3 py-1.5 text-xs font-bold rounded-full border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          Delete{adminSuffix}
        </button>
      </div>

      <PasswordPromptModal
        open={modal === "edit"}
        title="Edit post"
        description={
          isAdmin
            ? "Admin access — no password needed."
            : "Enter the 4-digit password you set when posting."
        }
        submitLabel="Continue to edit"
        isAdmin={isAdmin}
        loading={loading}
        error={error}
        onClose={() => {
          if (!loading) {
            setModal(null);
            setError(null);
          }
        }}
        onSubmit={(pw) => void handleEdit(pw)}
      />

      <PasswordPromptModal
        open={modal === "delete"}
        title="Delete post?"
        description={
          isAdmin
            ? "This will hide the post from the forum (admin)."
            : "Enter your 4-digit password to confirm. This cannot be undone."
        }
        submitLabel="Delete"
        isAdmin={isAdmin}
        loading={loading}
        error={error}
        onClose={() => {
          if (!loading) {
            setModal(null);
            setError(null);
          }
        }}
        onSubmit={(pw) => void handleDelete(pw)}
      />
    </>
  );
}
