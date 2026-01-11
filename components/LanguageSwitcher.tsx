"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLang, setCurrentLang] = useState<"ko" | "en">("ko");

  useEffect(() => {
    // URL에서 언어 감지
    if (pathname?.startsWith("/en")) {
      setCurrentLang("en");
    } else {
      setCurrentLang("ko");
    }
  }, [pathname]);

  const switchLanguage = (lang: "ko" | "en") => {
    if (lang === currentLang) return;

    let newPath = pathname || "/";
    
    if (lang === "en") {
      // 한국어 경로를 영어 경로로 변환
      if (newPath === "/" || newPath === "/crossadmit") {
        newPath = "/en/crossadmit";
      } else if (newPath.startsWith("/crossadmit/register") && !newPath.includes("/en")) {
        newPath = newPath.replace("/crossadmit/register", "/en/crossadmit/register");
      } else if (newPath.startsWith("/crossadmit/") && !newPath.includes("/en")) {
        newPath = newPath.replace("/crossadmit/", "/en/crossadmit/");
      } else if (newPath.startsWith("/forum") && !newPath.includes("/en")) {
        newPath = newPath.replace("/forum", "/en/forum");
      } else if (newPath.startsWith("/admissions") && !newPath.includes("/en")) {
        newPath = newPath.replace("/admissions", "/en/admissions");
      } else if (!newPath.startsWith("/en") && newPath !== "/") {
        newPath = `/en${newPath}`;
      }
    } else {
      // 영어 경로를 한국어 경로로 변환
      if (newPath.startsWith("/en")) {
        newPath = newPath.replace("/en", "");
        if (newPath === "") newPath = "/crossadmit";
        if (newPath.startsWith("/crossadmit") && newPath !== "/crossadmit") {
          // Keep the path structure
        }
      }
    }

    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-0.5 border border-gray-300 rounded-md overflow-hidden">
      <button
        onClick={() => switchLanguage("ko")}
        className={`px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium transition-all ${
          currentLang === "ko"
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
        title="한국어"
      >
        KR
      </button>
      <div className="w-px bg-gray-300"></div>
      <button
        onClick={() => switchLanguage("en")}
        className={`px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium transition-all ${
          currentLang === "en"
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
        title="English"
      >
        US
      </button>
    </div>
  );
}
