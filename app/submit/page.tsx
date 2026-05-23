import { Suspense } from "react";
import type { Metadata } from "next";
import AnonymousSubmitForm from "@/components/submit/AnonymousSubmitForm";

export const metadata: Metadata = {
  title: "Create Post | CrossAdmit Study Korea",
  description:
    "Post anonymously about studying in Korea — no signup required.",
  robots: { index: false, follow: true },
};

export default function SubmitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#DAE0E6] flex items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <AnonymousSubmitForm />
    </Suspense>
  );
}
