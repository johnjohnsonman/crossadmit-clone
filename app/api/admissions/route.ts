import { NextRequest, NextResponse } from "next/server";
import { getAdmissions } from "@/lib/supabase/admissions-service";
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

  try {
    const { data, total } = await getAdmissions({
      year,
      year_before: yearBefore,
      admission_type: admissionType?.trim() || undefined,
      status,
      search: search?.trim() || undefined,
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
