import type { Metadata } from "next";
import { DEFAULT_KEYWORDS, SITE_NAME, SITE_URL } from "./constants";

/** Canonical without lang; hreflang en/ko/x-default */
export function seoAlternates(pathname: string): NonNullable<Metadata["alternates"]> {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const canonical =
    path === "/" ? SITE_URL : `${SITE_URL}${path}`.replace(/\/$/, "");

  return {
    canonical,
    languages: {
      en: `${canonical}?lang=en`,
      ko: canonical,
      "x-default": canonical,
    },
  };
}

export function seoOpenGraph(
  partial: NonNullable<Metadata["openGraph"]>
): NonNullable<Metadata["openGraph"]> {
  return {
    siteName: SITE_NAME,
    locale: "en_US",
    alternateLocale: ["ko_KR"],
    ...partial,
  };
}

export function seoTwitter(
  title: string,
  description: string
): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title,
    description,
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CrossAdmit | Study in Korea Guide for International Students",
    template: "%s | CrossAdmit",
  },
  description:
    "Trusted guide for international students studying in Korea. Visa information, admissions, scholarships, dormitory tips, and connections with 141+ verified Korean university students.",
  keywords: [...DEFAULT_KEYWORDS],
  authors: [{ name: "CrossAdmit Team" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: seoAlternates("/"),
  openGraph: seoOpenGraph({
    type: "website",
    url: SITE_URL,
    title: "CrossAdmit | Study in Korea Guide",
    description:
      "Trusted guide for international students. Visa, admissions, scholarships, and verified Korean university mentors.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Study in Korea`,
      },
    ],
  }),
  twitter: {
    ...seoTwitter(
      "CrossAdmit | Study in Korea Guide",
      "Trusted guide for international students studying in Korea."
    ),
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {},
  category: "education",
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: ["크로스어드밋", "交叉录取"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: "Study in Korea guide for international students",
  sameAs: [] as string[],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "hello@chairpark.com",
    availableLanguage: ["English", "Korean"],
  },
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: ["크로스어드밋", "CrossAdmit"],
  url: SITE_URL,
  inLanguage: ["en", "ko", "zh-CN", "zh-TW", "es", "ja"],
  description:
    "Study in Korea guides, community forum, and university admission statistics for international students.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};
