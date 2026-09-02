import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS, createAuthCookieValue } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const password = formData.get("password");
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || typeof password !== "string" || password !== sitePassword) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  const cookieValue = await createAuthCookieValue();
  const res = NextResponse.redirect(new URL("/", req.url), { status: 303 });
  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
