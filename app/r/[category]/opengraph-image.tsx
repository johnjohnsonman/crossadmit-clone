import { ImageResponse } from "next/og";
import { getCategorySeoName } from "@/lib/seo/categories";
import { OgImageLayout } from "@/lib/seo/og-layout";

export const runtime = "edge";
export const alt = "CrossAdmit Study in Korea";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ category: string }>;
};

export default async function Image({ params }: Props) {
  const { category } = await params;
  const names = getCategorySeoName(category);

  return new ImageResponse(
    (
      <OgImageLayout
        badge={`r/${category}`}
        title={names.en}
        subtitle="International students in Korea · CrossAdmit"
      />
    ),
    { ...size }
  );
}
