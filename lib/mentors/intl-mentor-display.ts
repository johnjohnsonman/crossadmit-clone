const COUNTRY_FLAGS: Record<string, string> = {
  Vietnam: "🇻🇳",
  China: "🇨🇳",
  Indonesia: "🇮🇩",
  Thailand: "🇹🇭",
  Philippines: "🇵🇭",
  Mongolia: "🇲🇳",
  "United States": "🇺🇸",
  Japan: "🇯🇵",
  Malaysia: "🇲🇾",
  India: "🇮🇳",
  Bangladesh: "🇧🇩",
  Nepal: "🇳🇵",
  Myanmar: "🇲🇲",
  Uzbekistan: "🇺🇿",
  Kazakhstan: "🇰🇿",
};

export function mentorAvatarEmoji(
  handle: string,
  homeCountry?: string
): string {
  if (homeCountry && COUNTRY_FLAGS[homeCountry]) {
    return COUNTRY_FLAGS[homeCountry];
  }
  const name = handle.trim() || "A";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function classOfLabel(year: number, locale: "ko" | "en"): string {
  return locale === "en" ? `Class of ${year}` : `${year}년`;
}
