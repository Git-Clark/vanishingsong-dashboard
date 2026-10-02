// POST /api/publish/facebook
//
// Body: { message: string, imageUrl?: string, link?: string }
// With an imageUrl it becomes a Page photo post, otherwise a feed post
// (optionally with a link attachment).
// Protected by middleware.ts and re-checked here so the response is JSON.

import { NextRequest, NextResponse } from "next/server";
import { isAuthedRequest } from "@/lib/apiAuth";
import { isMetaConfigured, publishToFacebook } from "@/lib/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAuthedRequest())) {
    return NextResponse.json({ ok: false, error: "Not signed in. Reload the dashboard and log in again." }, { status: 401 });
  }

  if (!isMetaConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Publishing is not connected on this deployment yet. Follow SETUP-META.md to add the Meta credentials." },
      { status: 503 }
    );
  }

  let body: { message?: unknown; imageUrl?: unknown; link?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the request body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const link = typeof body.link === "string" ? body.link.trim() : "";

  if (!message.trim() && !imageUrl) {
    return NextResponse.json(
      { ok: false, error: "A Facebook post needs a message, an image, or both." },
      { status: 400 }
    );
  }

  const result = await publishToFacebook({
    message,
    imageUrl: imageUrl || undefined,
    link: link || undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, id: result.id, permalink: result.permalink });
}
