import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://crossadmit.com"; // 실제 도메인으로 변경 필요

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/_next/",
          "/private/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
        ],
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
        ],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
