"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UniversityPick = {
  id: number;
  name_kr: string;
  name_en: string;
};

type Props = {
  value: string;
  univId: number | null;
  onChange: (name: string) => void;
  onSelect: (univ: UniversityPick) => void;
  onClearId?: () => void;
  placeholder?: string;
  className?: string;
  /** en: prefer English name in input and dropdown */
  locale?: "ko" | "en";
};

function displayName(u: UniversityPick, locale: "ko" | "en"): string {
  if (locale === "en" && u.name_en.trim()) return u.name_en;
  return u.name_kr;
}

export default function UniversityAutocomplete({
  value,
  univId,
  onChange,
  onSelect,
  onClearId,
  placeholder,
  className = "",
  locale = "ko",
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [options, setOptions] = useState<UniversityPick[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadUniversities = useCallback(async (q: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("search", q.trim());
    if (locale === "en") params.set("locale", "en");
    const res = await fetch(`/api/universities?${params.toString()}`);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      universities?: Array<{
        id: number;
        name_kr: string;
        name_en: string;
      }>;
    };
    return (data.universities ?? []).map((u) => ({
      id: u.id,
      name_kr: u.name_kr,
      name_en: u.name_en,
    }));
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    void loadUniversities(value).then((list) => {
      if (!cancelled) setOptions(list.slice(0, 8));
    });
    return () => {
      cancelled = true;
    };
  }, [value, loadUniversities]);

  useEffect(() => {
    function handleDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDoc);
    return () => document.removeEventListener("mousedown", handleDoc);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [value, open, options.length]);

  function pick(u: UniversityPick) {
    onChange(displayName(u, locale));
    onSelect(u);
    setOpen(false);
    inputRef.current?.blur();
  }

  const inputClass =
    className ||
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400";

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        className={inputClass}
        autoComplete="off"
        onChange={(e) => {
          onClearId?.();
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || options.length === 0) {
            if (e.key === "Enter") e.preventDefault();
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (h + 1) % options.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (h - 1 + options.length) % options.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(options[highlight] ?? options[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {univId !== null && value.trim() && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-green-600 font-medium">
          ✓
        </span>
      )}
      {open && options.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
          role="listbox"
        >
          {options.map((u, i) => (
            <li key={u.id}>
              <button
                type="button"
                className={`flex w-full flex-col px-3 py-2 text-left hover:bg-blue-50 ${
                  i === highlight ? "bg-blue-50" : ""
                }`}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  pick(u);
                }}
              >
                <span className="font-medium text-gray-900">
                  {locale === "en" ? displayName(u, "en") : u.name_kr}
                </span>
                {locale === "en" && u.name_kr ? (
                  <span className="text-xs text-gray-500">{u.name_kr}</span>
                ) : u.name_en ? (
                  <span className="text-xs text-gray-500">{u.name_en}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
