import { NextResponse, type NextRequest } from "next/server";
import { isGonePath } from "./lib/gonePaths";

export function proxy(request: NextRequest) {
  if (isGonePath(request.nextUrl.pathname)) {
    return new NextResponse(
      "<!doctype html><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\"><title>Page removed</title><p>This page has been removed. <a href=\"/\">Go to the calculator</a>.</p>",
      { status: 410, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/fire-in/:path*",
    "/best-cities-for-fire/:path*",
    "/cost-of-living/:path*",
    "/cost-of-living-in/:path*",
    "/salary-needed-in/:path*",
    "/compare/:path*",
  ],
};
