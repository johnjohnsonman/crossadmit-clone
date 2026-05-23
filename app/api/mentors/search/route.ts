import { NextRequest, NextResponse } from "next/server";
import { searchMentors } from "@/lib/mentors/search";
import { MENTOR_PAGE_SIZE } from "@/lib/mentors/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

    const result = await searchMentors({
      q: searchParams.get("q") ?? undefined,
      country: searchParams.get("country") ?? undefined,
      offers: searchParams.get("offers") ?? undefined,
      price: searchParams.get("price") ?? undefined,
      sort: searchParams.get("sort") ?? "popular",
      page,
      limit: MENTOR_PAGE_SIZE,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (e) {
    console.error("[mentors/search]", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Search failed",
      },
      { status: 500 }
    );
  }
}
