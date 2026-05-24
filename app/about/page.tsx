import { StaticInfoPage } from "@/components/StaticInfoPage";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function AboutPage({ searchParams }: Props) {
  const sp = await searchParams;
  return <StaticInfoPage pageKey="about" lang={sp.lang} />;
}
