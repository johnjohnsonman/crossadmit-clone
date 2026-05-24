import { StaticInfoPage } from "@/components/StaticInfoPage";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const sp = await searchParams;
  return <StaticInfoPage pageKey="contact" lang={sp.lang} />;
}
