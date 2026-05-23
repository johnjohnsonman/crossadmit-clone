import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://crossadmit.com"; // 실제 도메인으로 변경 필요

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        allow: ["/forum", "/r/"],
        disallow: [
          "/api/",
          "/admin/",
          "/_next/",
          "/private/",
          "/search",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        allow: ["/forum", "/r/"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/search",
        ],
      },
      {
        userAgent: "Baiduspider",
        allow: ["/forum", "/r/"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/search",
        ],
      },
      {
        userAgent: "Yandex",
        allow: ["/forum", "/r/"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/search",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
