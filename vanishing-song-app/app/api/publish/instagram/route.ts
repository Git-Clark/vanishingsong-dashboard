// POST /api/publish/instagram
//
// Body: { caption: string, imageUrl?: string, videoUrl?: string }
// An imageUrl publishes a single image post; a videoUrl publishes a Reel.
// Protected by middleware.ts and re-checked here so the response is JSON.

import { NextRequest, NextResponse } from "next/server";
import { isAuthedRequest } from "@/lib/apiAuth";
import { isMetaConfigured, publishToInstagram, publishReelToInstagram } from "@/lib/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Reel uploads are polled for up to 60s while Meta transcodes the video.
export const maxDuration = 60;

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

  let body: { caption?: unknown; imageUrl?: unknown; videoUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the request body." }, { status: 400 });
  }

  const caption = typeof body.caption === "string" ? body.caption : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";

  if (!imageUrl && !videoUrl) {
    return NextResponse.json(
      { ok: false, error: "Instagram needs an image URL or a video URL — it cannot post text on its own." },
      { status: 400 }
    );
  }
  if (imageUrl && videoUrl) {
    return NextResponse.json(
      { ok: false, error: "Send either an image URL or a video URL, not both." },
      { status: 400 }
    );
  }

  const result = videoUrl
    ? await publishReelToInstagram({ videoUrl, caption })
    : await publishToInstagram({ imageUrl, caption });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, id: result.id, permalink: result.permalink });
}
