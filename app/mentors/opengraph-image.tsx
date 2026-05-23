import { ImageResponse } from "next/og";
import { OgImageLayout } from "@/lib/seo/og-layout";

export const runtime = "edge";
export const alt = "Verified Korean University Mentors | CrossAdmit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgImageLayout
        badge="Mentors"
        title="141+ Verified Mentors"
        subtitle="SNU · Yonsei · Korea University · KAIST & more"
      />
    ),
    { ...size }
  );
}
