import { permanentRedirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

/** Study Guide hub merged into forum — permanent redirect. */
export default async function StudyKoreaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const lang = sp.lang?.trim();
  permanentRedirect(
    lang ? `/forum?lang=${encodeURIComponent(lang)}` : "/forum"
  );
}
