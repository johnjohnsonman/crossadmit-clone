import type { Metadata } from "next";
import { Suspense } from "react";
import AdmissionsBulletinBoard from "@/components/admissions/AdmissionsBulletinBoard";
import { getDictionary } from "@/lib/i18n/dictionary";
import { resolveLocale } from "@/lib/i18n/locale";
import { seoAlternates } from "@/lib/seo/metadata";

function AdmissionsFallback() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-sm text-[#7C7C7C]">불러오는 중…</p>
    </main>
  );
}

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

export function generateMetadata(): Metadata {
  return {
    alternates: seoAlternates("/admissions"),
  };
}

export default async function AdmissionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = resolveLocale(sp.lang);
  const dict = getDictionary(locale);

  return (
    <Suspense fallback={<AdmissionsFallback />}>
      <AdmissionsBulletinBoard locale={locale} dict={dict} />
    </Suspense>
  );
}
