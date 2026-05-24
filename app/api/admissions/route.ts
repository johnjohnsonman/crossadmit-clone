import { NextRequest, NextResponse } from "next/server";
import { parseAdmitTrackList } from "@/lib/admissions/admit-track";
import {
  getAdmissions,
  getFeaturedIntlStories,
  getIntlAdmissionsSummary,
} from "@/lib/supabase/admissions-service";
import type { AdmissionStatusFilter } from "@/lib/supabase/admissions-service";
import { getDcCommentCounts } from "@/lib/supabase/comment-counts";
import { admissionToRecord } from "@/lib/supabase/map";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseStatus(raw: string | null): AdmissionStatusFilter | undefined {
  if (raw === "regist" || raw === "accept" || raw === "reject") return raw;
  if (raw === "등록") return "regist";
  if (raw === "합격") return "accept";
  if (raw === "불합격") return "reject";
  return undefined;
}

function parseSort(raw: string | null) {
  if (raw === "likes" || raw === "popular") return "likes" as const;
  if (raw === "views") return "views" as const;
  if (raw === "oldest") return "oldest" as const;
  return "latest" as const;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const yearParam = searchParams.get("year");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const admissionType = searchParams.get("admission_type");
  const search = searchParams.get("search");
  const status = parseStatus(searchParams.get("status"));
  const sort = parseSort(searchParams.get("sort"));
  const admitTrackParam = searchParams.get("admit_track");
  const admit_track = parseAdmitTrackList(admitTrackParam ?? undefined);
  const univIdParam = searchParams.get("univ_id");
  let univ_id: number | undefined;
  if (univIdParam) {
    const n = parseInt(univIdParam, 10);
    if (!Number.isNaN(n)) univ_id = n;
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 20;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  let year: number | undefined;
  let yearBefore: number | undefined;
  if (yearParam === "before2019" || yearParam === "2019이전") {
    yearBefore = 2019;
  } else if (yearParam) {
    const y = parseInt(yearParam, 10);
    if (!Number.isNaN(y)) year = y;
  }

  const featuredOnly = searchParams.get("featured") === "1";
  const intlSummaryOnly = searchParams.get("intl_summary") === "1";

  try {
    if (intlSummaryOnly) {
      const summary = await getIntlAdmissionsSummary();
      return NextResponse.json(summary, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    if (featuredOnly) {
      const lim = Number.isNaN(limit) ? 4 : Math.min(limit, 8);
      const data = await getFeaturedIntlStories(lim);
      const ids = data.map((r) => r.id);
      const dcCounts = await getDcCommentCounts(ids);
      const records = data.map((row) => ({
        ...admissionToRecord(row),
        dcCommentCount: dcCounts[row.id] ?? 0,
      }));
      return NextResponse.json(
        { data: records, total: records.length, limit: lim, offset: 0 },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const { data, total } = await getAdmissions({
      year,
      year_before: yearBefore,
      admission_type: admissionType?.trim() || undefined,
      status,
      search: search?.trim() || undefined,
      univ_id,
      admit_track: admit_track.length > 0 ? admit_track : undefined,
      sort,
      limit: Number.isNaN(limit) ? 20 : limit,
      offset: Number.isNaN(offset) ? 0 : offset,
    });

    const ids = (data ?? []).map((r) => r.id);
    const dcCounts = await getDcCommentCounts(ids);

    const records = (data ?? []).map((row) => ({
      ...admissionToRecord(row),
      dcCommentCount: dcCounts[row.id] ?? 0,
    }));

    return NextResponse.json(
      {
        data: records,
        total,
        limit,
        offset,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}
