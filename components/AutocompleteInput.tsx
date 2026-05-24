"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type AutocompleteItem = { label: string; hint?: string };

/** 하위 호환: 문자열은 label만 있는 항목으로 처리 */
export type AutocompleteOption = AutocompleteItem | string;

export type AutocompleteInputProps = {
  options?: AutocompleteOption[];
  value: string;
  onChange: (v: string) => void;
  onSelect?: (label: string, item?: AutocompleteItem) => void;
  loadOptions?: (q: string) => Promise<AutocompleteOption[]>;
  placeholder?: string;
  className?: string;
  id?: string;
  maxSuggestions?: number;
};

function normalizeOption(opt: AutocompleteOption): AutocompleteItem {
  return typeof opt === "string" ? { label: opt } : opt;
}

function normalizeOptions(opts?: AutocompleteOption[] | null): AutocompleteItem[] {
  if (!opts || !Array.isArray(opts)) return [];
  return opts.map(normalizeOption);
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export default function AutocompleteInput({
  options = [],
  value,
  onChange,
  onSelect,
  loadOptions,
  placeholder,
  className = "",
  id,
  maxSuggestions = 8,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [asyncOptions, setAsyncOptions] = useState<AutocompleteOption[] | null>(
    null
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loadOptions) {
      setAsyncOptions(null);
      return;
    }
    let cancelled = false;
    void loadOptions(value).then((list) => {
      if (!cancelled) setAsyncOptions(Array.isArray(list) ? list : []);
    });
    return () => {
      cancelled = true;
    };
  }, [value, loadOptions]);

  const optionList = useMemo(
    () => normalizeOptions(asyncOptions ?? options),
    [asyncOptions, options]
  );

  const filtered = useMemo(() => {
    const q = normalize(value);
    if (!q) {
      return optionList.slice(0, maxSuggestions);
    }
    const out: AutocompleteItem[] = [];
    for (const item of optionList) {
      const hint = item.hint ?? "";
      const match =
        normalize(item.label).includes(q) ||
        normalize(hint).includes(q) ||
        `${normalize(item.label)} ${normalize(hint)}`.includes(q);
      if (match) {
        out.push(item);
        if (out.length >= maxSuggestions) break;
      }
    }
    return out;
  }, [optionList, value, maxSuggestions]);

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

  function pick(item: AutocompleteItem) {
    onChange(item.label);
    onSelect?.(item.label, item);
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
            pick(filtered[highlight] ?? filtered[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-800 bg-gray-900 py-1 text-sm shadow-lg shadow-black/40"
          role="listbox"
        >
          {filtered.map((item, i) => (
            <li key={`${item.label}-${item.hint ?? ""}-${i}`}>
              <button
                type="button"
                className={`flex w-full px-3 py-2 text-left text-white hover:bg-gray-800 ${
                  i === highlight ? "bg-gray-800" : ""
                }`}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  pick(item);
                }}
              >
                {item.label}
                {item.hint ? (
                  <span className="ml-2 text-xs text-gray-500">{item.hint}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
