import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Legacy /en/* routes → same path with ?lang=en */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/en")) return NextResponse.next();

  const stripped = pathname.replace(/^\/en/, "") || "/crossadmit";
  const url = request.nextUrl.clone();
  url.pathname = stripped;
  url.searchParams.set("lang", "en");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/en", "/en/:path*"],
};
