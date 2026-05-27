import { Suspense } from "react";
import type { Metadata } from "next";
import AnonymousSubmitForm from "@/components/submit/AnonymousSubmitForm";

export const metadata: Metadata = {
  title: "Edit Post | CrossAdmit Study Korea",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

function EditFallback() {
  return (
    <div className="min-h-screen bg-[#DAE0E6] flex items-center justify-center text-sm">
      Loading…
    </div>
  );
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<EditFallback />}>
      <AnonymousSubmitForm mode="edit" postId={id} />
    </Suspense>
  );
}
