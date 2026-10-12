// Minimal signed-cookie session for the site's single shared password.
// No third-party auth library — a cookie value of `${issuedAt}.${hmac}` is
// verified against SITE_PASSWORD-derived key using Web Crypto (works in
// both the Edge middleware runtime and Node.js API routes).

export const COOKIE_NAME = "vs_auth";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day

function getSecret(): string {
  // Falls back to a fixed dev-only string so local dev works even before
  // SITE_PASSWORD is set — never rely on that fallback in production.
  return process.env.SITE_PASSWORD || "vanishing-song-dev-secret";
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

export async function createAuthCookieValue(): Promise<string> {
  const issuedAt = Date.now().toString();
  const sig = await hmacHex(getSecret(), issuedAt);
  return `${issuedAt}.${sig}`;
}

export async function isValidAuthCookieValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const [issuedAt, sig] = value.split(".");
  if (!issuedAt || !sig) return false;

  const expected = await hmacHex(getSecret(), issuedAt);
  if (expected !== sig) return false;

  const age = Date.now() - Number(issuedAt);
  if (Number.isNaN(age) || age < 0 || age > COOKIE_MAX_AGE_SECONDS * 1000) return false;

  return true;
}
