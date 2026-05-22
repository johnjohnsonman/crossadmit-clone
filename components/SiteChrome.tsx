"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import NavbarEN from "@/components/NavbarEN";
import FloatingAdmissions from "@/components/FloatingAdmissions";
import Footer from "@/components/Footer";

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEn = pathname?.startsWith("/en") ?? false;

  useEffect(() => {
    document.documentElement.lang = isEn ? "en" : "ko";
  }, [isEn]);

  return (
    <>
      {isEn ? <NavbarEN /> : <Navbar />}
      <FloatingAdmissions />
      {children}
      <Footer />
    </>
  );
}
