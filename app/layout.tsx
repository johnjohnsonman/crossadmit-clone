import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import StructuredData from "@/components/StructuredData";
import {
  organizationJsonLd,
  rootMetadata,
  websiteJsonLd,
} from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        <StructuredData data={organizationJsonLd} />
        <StructuredData data={websiteJsonLd} />
        <link rel="alternate" hrefLang="ko" href={SITE_URL} />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}?lang=en`} />
        <link rel="alternate" hrefLang="zh-CN" href={`${SITE_URL}/zh`} />
        <link rel="alternate" hrefLang="zh-TW" href={`${SITE_URL}/zh-tw`} />
        <link rel="alternate" hrefLang="es" href={`${SITE_URL}/es`} />
        <link rel="alternate" hrefLang="ja" href={`${SITE_URL}/ja`} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
      </head>
      <body className="antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
