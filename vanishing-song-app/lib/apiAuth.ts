// Shared auth guard for the publishing API routes.
//
// middleware.ts already blocks unauthenticated requests to everything except
// /login and /api/login, but a browser fetch() follows that redirect and would
// receive the login page's HTML instead of JSON. Re-checking the signed cookie
// here lets the route answer with a clean 401 JSON body instead, and keeps the
// publishing endpoints protected even if the middleware matcher ever changes.

import { cookies } from "next/headers";
import { COOKIE_NAME, isValidAuthCookieValue } from "./auth";

export async function isAuthedRequest(): Promise<boolean> {
  const cookie = cookies().get(COOKIE_NAME)?.value;
  return isValidAuthCookieValue(cookie);
}
