import { Suspense } from "react";
import AdmissionsBulletinBoard from "@/components/admissions/AdmissionsBulletinBoard";

function AdmissionsFallback() {
  return (
    <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <p className="text-sm text-[#6B7280]">불러오는 중…</p>
    </main>
  );
}

export default function AdmissionsPage() {
  return (
    <Suspense fallback={<AdmissionsFallback />}>
      <AdmissionsBulletinBoard locale="ko" />
    </Suspense>
  );
}
