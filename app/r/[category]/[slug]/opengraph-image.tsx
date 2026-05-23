import { ImageResponse } from "next/og";
import { OgImageLayout } from "@/lib/seo/og-layout";
import { getPostTitleForOg } from "@/lib/seo/post-og";

export const runtime = "edge";
export const alt = "CrossAdmit Article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ category: string; slug: string }>;
};

export default async function Image({ params }: Props) {
  const { category, slug } = await params;
  const post = await getPostTitleForOg(category, slug);

  return new ImageResponse(
    (
      <OgImageLayout
        badge={post?.categoryLabel ?? `r/${category}`}
        title={post?.title ?? "Study in Korea Guide"}
        subtitle="CrossAdmit · International Students in Korea"
      />
    ),
    { ...size }
  );
}
