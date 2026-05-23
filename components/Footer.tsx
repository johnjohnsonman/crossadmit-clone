"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import { withLang } from "@/lib/i18n/locale";

function FooterInner() {
  const searchParams = useSearchParams();
  const locale: Locale = searchParams.get("lang") === "en" ? "en" : "ko";
  const t = getDictionary(locale);
  const href = (path: string) => withLang(path, locale);

  return (
    <footer className="bg-sage-800 text-sage-200 py-6 md:py-12 mt-10 md:mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <div>
            <h3 className="text-sm md:text-lg font-serif text-white mb-2 md:mb-4">
              {t.footer_brand}
            </h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link
                  href={href("/about")}
                  className="hover:text-tea-300 transition-colors"
                >
                  {t.footer_about}
                </Link>
              </li>
              <li>
                <Link
                  href={href("/contact")}
                  className="hover:text-tea-300 transition-colors"
                >
                  {t.footer_contact}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-serif text-white mb-2 md:mb-4">
              {t.footer_legal}
            </h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link
                  href={href("/privacy")}
                  className="hover:text-tea-300 transition-colors"
                >
                  {t.footer_privacy}
                </Link>
              </li>
              <li>
                <Link
                  href={href("/terms")}
                  className="hover:text-tea-300 transition-colors"
                >
                  {t.footer_terms}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-serif text-white mb-2 md:mb-4">
              {t.footer_contact_info}
            </h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>{t.footer_business}</li>
              <li>{t.footer_customer}</li>
              <li>{t.footer_email}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-serif text-white mb-2 md:mb-4">
              {t.footer_social}
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-xs md:text-sm hover:text-tea-300 transition-colors"
              >
                {t.footer_kakao}
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-sage-700 mt-4 md:mt-8 pt-4 md:pt-8 text-center text-xs md:text-sm">
          <p>{t.footer_copyright}</p>
        </div>
      </div>
    </footer>
  );
}

export default function Footer() {
  return (
    <Suspense fallback={<footer className="bg-sage-800 h-24 mt-10" />}>
      <FooterInner />
    </Suspense>
  );
}
