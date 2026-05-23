import type { Locale } from "./dictionary";

export function resolveLocale(lang?: string | null): Locale {
  return lang === "en" ? "en" : "ko";
}

/** Append ?lang=en for English; preserve existing query string. */
export function withLang(path: string, locale: Locale): string {
  if (locale !== "en") return path;
  const q = path.indexOf("?");
  const pathname = q >= 0 ? path.slice(0, q) : path;
  const params = new URLSearchParams(q >= 0 ? path.slice(q + 1) : "");
  params.set("lang", "en");
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : `${pathname}?lang=en`;
}
