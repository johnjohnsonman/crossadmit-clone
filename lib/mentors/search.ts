import { createClient } from "@/lib/supabase/server";
import {
  COUNTRY_FILTER_MAP,
  MENTOR_CARD_SELECT,
  MENTOR_PAGE_SIZE,
} from "./constants";
import type { MentorRow, MentorSearchParams, MentorSearchResult } from "./types";

function escapeIlike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function minPrice(m: MentorRow): number {
  const prices: number[] = [];
  if (m.offers_admission && Number(m.price_admission_usd) > 0) {
    prices.push(Number(m.price_admission_usd));
  }
  if (m.offers_career && Number(m.price_career_usd) > 0) {
    prices.push(Number(m.price_career_usd));
  }
  return prices.length ? Math.min(...prices) : 0;
}

function matchesPriceBand(m: MentorRow, price: string): boolean {
  const isFree = !m.offers_admission && !m.offers_career;
  const min = minPrice(m);

  switch (price) {
    case "free":
      return isFree || min === 0;
    case "1-30":
      return min > 0 && min <= 30;
    case "30-100":
      return min > 30 && min <= 100;
    case "100+":
      return min > 100;
    default:
      return true;
  }
}

export async function searchMentors(
  params: MentorSearchParams
): Promise<MentorSearchResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(params.limit ?? MENTOR_PAGE_SIZE, 48);
  const offset = (page - 1) * limit;
  const sort = params.sort ?? "popular";
  const countryKey = params.country?.toLowerCase();
  const needsCountryFilter = Boolean(countryKey && countryKey !== "all");
  const needsPriceFilter = Boolean(params.price && params.price !== "all");
  const needsClientFilter = needsPriceFilter || needsCountryFilter;

  let query = supabase
    .from("mentors")
    .select(MENTOR_CARD_SELECT, { count: "exact" })
    .eq("is_active", true);

  if (params.q?.trim()) {
    const safe = escapeIlike(params.q.trim());
    query = query.or(
      `nickname.ilike.%${safe}%,university_name_freetext.ilike.%${safe}%`
    );
  }

  if (params.offers === "admission") {
    query = query.eq("offers_admission", true);
  } else if (params.offers === "career") {
    query = query.eq("offers_career", true);
  } else if (params.offers === "free") {
    query = query.eq("offers_admission", false).eq("offers_career", false);
  }

  if (sort === "newest") {
    query = query.order("legacy_created_at", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (sort === "price_asc") {
    query = query
      .order("price_admission_usd", { ascending: true })
      .order("price_career_usd", { ascending: true });
  } else if (sort === "price_desc") {
    query = query
      .order("price_admission_usd", { ascending: false })
      .order("price_career_usd", { ascending: false });
  } else {
    query = query.order("view_count", { ascending: false });
  }

  const fetchLimit = needsClientFilter ? 300 : limit;
  const fetchOffset = needsClientFilter ? 0 : offset;

  const { data, error, count } = await query.range(
    fetchOffset,
    fetchOffset + fetchLimit - 1
  );

  if (error) {
    console.error("[searchMentors]", error);
    throw new Error(error.message);
  }

  let mentors = (data ?? []) as unknown as MentorRow[];

  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    mentors = mentors.filter((m) => {
      const uni =
        m.university?.name_kr?.toLowerCase() ??
        m.university?.name_en?.toLowerCase() ??
        "";
      return (
        m.nickname.toLowerCase().includes(q) ||
        (m.university_name_freetext?.toLowerCase().includes(q) ?? false) ||
        uni.includes(q)
      );
    });
  }

  if (needsCountryFilter && countryKey) {
    const code = COUNTRY_FILTER_MAP[countryKey];
    mentors = mentors.filter((m) => {
      const c = m.university?.country;
      if (countryKey === "other") {
        return !c || !["KR", "US", "GB"].includes(c);
      }
      if (code) return c === code;
      return true;
    });
  }

  if (needsPriceFilter && params.price) {
    mentors = mentors.filter((m) => matchesPriceBand(m, params.price!));
  }

  const total = needsClientFilter ? mentors.length : (count ?? mentors.length);
  const paged = needsClientFilter
    ? mentors.slice(offset, offset + limit)
    : mentors;

  return {
    mentors: paged,
    total,
    page,
    limit,
  };
}
