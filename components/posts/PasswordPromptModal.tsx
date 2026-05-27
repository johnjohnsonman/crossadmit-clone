"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  submitLabel?: string;
  isAdmin?: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
};

export default function PasswordPromptModal({
  open,
  title,
  description,
  submitLabel = "Continue",
  isAdmin = false,
  loading = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) setPassword("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal
      aria-labelledby="password-modal-title"
    >
      <div className="w-full max-w-sm bg-white dark:bg-[#1A1A1B] rounded-lg border border-[#EDEFF1] dark:border-[#343536] shadow-xl p-5">
        <h2
          id="password-modal-title"
          className="text-lg font-bold text-[#1C1C1C] dark:text-[#D7DADC]"
        >
          {title}
          {isAdmin && (
            <span className="ml-2 text-xs font-bold text-orange-500">(admin)</span>
          )}
        </h2>
        {description && (
          <p className="text-sm text-[#7C7C7C] dark:text-[#818384] mt-2">{description}</p>
        )}

        {!isAdmin && (
          <label className="block mt-4 text-sm font-medium text-[#1C1C1C] dark:text-[#D7DADC]">
            4-digit password
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={password}
              onChange={(e) =>
                setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="mt-1 w-full px-3 py-2 border border-[#EDEFF1] dark:border-[#343536] rounded text-sm bg-white dark:bg-[#272729] text-[#1C1C1C] dark:text-[#D7DADC]"
            />
          </label>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-bold rounded-full border border-[#EDEFF1] dark:border-[#343536] text-[#7C7C7C] hover:bg-[#F6F7F8] dark:hover:bg-[#272729] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || (!isAdmin && password.length !== 4)}
            onClick={() => onSubmit(isAdmin ? "" : password)}
            className="px-4 py-2 text-sm font-bold rounded-full bg-[#FF4500] text-white hover:bg-[#e03d00] disabled:opacity-50"
          >
            {loading ? "…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
