import { StaticInfoPage } from "@/components/StaticInfoPage";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function TermsPage({ searchParams }: Props) {
  const sp = await searchParams;
  return <StaticInfoPage pageKey="terms" lang={sp.lang} />;
}
