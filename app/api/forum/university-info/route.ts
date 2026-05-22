import { NextRequest, NextResponse } from "next/server";
import { SLUG_NAME_HINTS } from "@/lib/forum/constants";
import { getUniversityById } from "@/lib/supabase/universities-service";
import { resolveUniversityId } from "@/lib/pipeline/study-korea/university-id";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const hints = SLUG_NAME_HINTS[slug];
  const id = await resolveUniversityId(slug);
  if (!id) {
    return NextResponse.json({
      slug,
      university: null,
      hints: hints ?? [],
    });
  }

  try {
    const university = await getUniversityById(id);
    return NextResponse.json({ slug, university });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
