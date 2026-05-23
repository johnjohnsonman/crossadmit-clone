import { Suspense } from "react";
import AdmissionsBulletinBoard from "@/components/admissions/AdmissionsBulletinBoard";
import { getDictionary } from "@/lib/i18n/dictionary";
import { resolveLocale } from "@/lib/i18n/locale";

function AdmissionsFallback() {
  return (
    <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <p className="text-sm text-[#6B7280]">불러오는 중…</p>
    </main>
  );
}

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

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
