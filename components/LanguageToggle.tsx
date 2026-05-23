"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/dictionary";

function LanguageToggleInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLang: Locale =
    searchParams.get("lang") === "en" ? "en" : "ko";

  const switchLang = (lang: Locale) => {
    if (lang === currentLang) return;
    const params = new URLSearchParams(searchParams.toString());
    if (lang === "en") params.set("lang", "en");
    else params.delete("lang");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const btnClass = (active: boolean) =>
    `px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium transition-all ${
      active
        ? "bg-orange-500 text-white"
        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
    }`;

  return (
    <div className="flex items-center gap-0.5 border border-gray-700 rounded-md overflow-hidden bg-gray-900">
      <button
        type="button"
        onClick={() => switchLang("ko")}
        className={btnClass(currentLang === "ko")}
        title="한국어"
      >
        KR
      </button>
      <div className="w-px bg-gray-700" />
      <button
        type="button"
        onClick={() => switchLang("en")}
        className={btnClass(currentLang === "en")}
        title="English"
      >
        US
      </button>
    </div>
  );
}

export default function LanguageToggle() {
  return (
    <Suspense
      fallback={
        <div className="h-8 w-20 rounded-md bg-gray-800 animate-pulse" />
      }
    >
      <LanguageToggleInner />
    </Suspense>
  );
}
