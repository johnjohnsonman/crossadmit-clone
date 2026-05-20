"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type AutocompleteInputProps = {
  options: string[];
  /** options와 동일 길이 권장 — 영문 등 보조 검색 */
  searchHints?: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  /** 매칭 최대 개수 */
  maxSuggestions?: number;
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export default function AutocompleteInput({
  options,
  searchHints,
  value,
  onChange,
  placeholder,
  className = "",
  id,
  maxSuggestions = 8,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = normalize(value);
    if (!q) {
      return options.slice(0, maxSuggestions).map((label, i) => ({
        label,
        index: i,
      }));
    }
    const out: { label: string; index: number }[] = [];
    for (let i = 0; i < options.length; i++) {
      const label = options[i];
      const hint = searchHints?.[i] ?? "";
      const match =
        normalize(label).includes(q) ||
        normalize(hint).includes(q) ||
        `${normalize(label)} ${normalize(hint)}`.includes(q);
      if (match) {
        out.push({ label, index: i });
        if (out.length >= maxSuggestions) break;
      }
    }
    return out;
  }, [options, searchHints, value, maxSuggestions]);

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
  }, [value, open]);

  function pick(label: string) {
    onChange(label);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || filtered.length === 0) {
            if (e.key === "Enter") e.preventDefault();
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (h + 1) % filtered.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(filtered[highlight]?.label ?? filtered[0].label);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
          role="listbox"
        >
          {filtered.map((item, i) => (
            <li key={`${item.label}-${item.index}`}>
              <button
                type="button"
                className={`flex w-full px-3 py-2 text-left hover:bg-tea-50 ${
                  i === highlight ? "bg-tea-50" : ""
                }`}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  pick(item.label);
                }}
              >
                {item.label}
                {searchHints?.[item.index] ? (
                  <span className="ml-2 text-xs text-gray-500">
                    {searchHints[item.index]}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
