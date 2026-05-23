import { Suspense } from "react";

export default function UniversityForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<p className="text-center py-12">Loading…</p>}>{children}</Suspense>;
}
