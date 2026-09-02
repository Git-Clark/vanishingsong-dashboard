import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidAuthCookieValue } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const authed = await isValidAuthCookieValue(cookie);

  if (!authed) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Protect every route except the login page itself and its API route
// (plus Next.js internals and the favicon), so unauthenticated visitors
// always land on /login instead of a redirect loop.
export const config = {
  matcher: ["/((?!api/login|login|_next/static|_next/image|favicon.ico).*)"],
};
