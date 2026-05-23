"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={submit} className="flex-1 max-w-xl mx-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search posts, communities..."
        className="w-full h-9 px-4 rounded-full border border-[#EDEFF1] bg-[#F6F7F8] text-sm text-[#1C1C1C] placeholder:text-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/30 dark:bg-[#272729] dark:border-[#343536] dark:text-[#D7DADC]"
      />
    </form>
  );
}
