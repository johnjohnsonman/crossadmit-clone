"use client";

import { useEffect, useRef, useState } from "react";

export type ApiAutocompleteInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (item: { label: string; id: number }) => void;
  fetchOptions: (query: string) => Promise<{ label: string; id: number }[]>;
  placeholder?: string;
  className?: string;
  id?: string;
};

export default function ApiAutocompleteInput({
  value,
  onChange,
  onSelect,
  fetchOptions,
  placeholder,
  className = "",
  id,
}: ApiAutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<{ label: string; id: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const list = await fetchOptions(value);
        setOptions(list);
        setHighlight(0);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchOptions]);

  function pick(item: { label: string; id: number }) {
    onChange(item.label);
    onSelect?.(item);
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
      {open && (options.length > 0 || loading) && (
        <ul
          className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
          role="listbox"
        >
          {loading && options.length === 0 ? (
            <li className="px-3 py-2 text-gray-500">검색 중…</li>
          ) : null}
          {options.map((item, i) => (
            <li key={`${item.id}-${item.label}`}>
              <button
                type="button"
                className={`flex w-full px-3 py-2 text-left hover:bg-tea-50 ${
                  i === highlight ? "bg-tea-50" : ""
                }`}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  pick(item);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
