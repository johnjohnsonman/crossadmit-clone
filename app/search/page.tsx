import Link from "next/link";
import RedditLayout from "@/components/reddit-style/RedditLayout";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export const metadata = {
  title: "Search | CrossAdmit Study Korea",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  return (
    <RedditLayout>
      <div className="bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] rounded p-8 text-center">
        <h1 className="text-xl font-bold text-[#1C1C1C] dark:text-[#D7DADC]">
          Search
        </h1>
        {q ? (
          <p className="mt-2 text-sm text-[#7C7C7C]">
            Full-text search for &quot;{q}&quot; is coming in Phase 3.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[#7C7C7C]">
            Enter a query from the forum header search bar.
          </p>
        )}
        <Link
          href="/forum"
          className="inline-block mt-4 text-sm font-bold text-[#FF4500] hover:underline"
        >
          ← Back to forum
        </Link>
      </div>
    </RedditLayout>
  );
}
