import { StaticInfoPage } from "@/components/StaticInfoPage";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function PrivacyPage({ searchParams }: Props) {
  const sp = await searchParams;
  return <StaticInfoPage pageKey="privacy" lang={sp.lang} />;
}
