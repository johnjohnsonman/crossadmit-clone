import { ImageResponse } from "next/og";
import { OgImageLayout } from "@/lib/seo/og-layout";

export const runtime = "edge";
export const alt = "CrossAdmit - Study in Korea Guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgImageLayout
        title="CrossAdmit"
        subtitle="Study in Korea Guide for International Students"
        footer={
          <div style={{ display: "flex", gap: 40, fontSize: 24, color: "#cbd5e1" }}>
            <span>📚 Guides</span>
            <span>💬 Community</span>
            <span>🎓 141+ Mentors</span>
          </div>
        }
      />
    ),
    { ...size }
  );
}
