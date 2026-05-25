import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import StructuredData from "@/components/StructuredData";
import {
  organizationJsonLd,
  rootMetadata,
  websiteJsonLd,
} from "@/lib/seo/metadata";

export const metadata: Metadata = rootMetadata;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const SHOULD_LOAD_GA =
  process.env.NODE_ENV === "production" && Boolean(GA_ID);

function buildGaInitScript(gaId: string) {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${gaId}', { send_page_view: false });
  `;
}

function buildGaPageviewScript(gaId: string) {
  return `
    (function () {
      if (typeof window.gtag !== 'function') return;
      const GA_ID = '${gaId}';
      const sendPageView = function () {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_path: window.location.pathname + window.location.search,
          page_location: window.location.href,
        });
      };

      const wrapHistoryMethod = function (type) {
        const original = history[type];
        if (typeof original !== 'function') return;
        history[type] = function () {
          const result = original.apply(this, arguments);
          window.setTimeout(sendPageView, 0);
          return result;
        };
      };

      wrapHistoryMethod('pushState');
      wrapHistoryMethod('replaceState');
      window.addEventListener('popstate', sendPageView);
      sendPageView();
    })();
  `;
}

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
      </head>
      <body className="antialiased">
        {SHOULD_LOAD_GA && GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {buildGaInitScript(GA_ID)}
            </Script>
            <Script id="ga4-pageviews" strategy="afterInteractive">
              {buildGaPageviewScript(GA_ID)}
            </Script>
          </>
        ) : null}
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
