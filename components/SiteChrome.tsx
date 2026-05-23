"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import FloatingAdmissions from "@/components/FloatingAdmissions";
import Footer from "@/components/Footer";
import type { Locale } from "@/lib/i18n/dictionary";

function SiteChromeInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const locale: Locale = searchParams.get("lang") === "en" ? "en" : "ko";

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "ko";
  }, [locale]);

  return (
    <>
      <Navbar />
      <FloatingAdmissions />
      {children}
      <Footer />
    </>
  );
}

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<>{children}</>}>
      <SiteChromeInner>{children}</SiteChromeInner>
    </Suspense>
  );
}
