// POST /api/publish/upload  (multipart/form-data, field name "file")
//
// Instagram's API never accepts raw file bytes — it only fetches a public URL
// — so a file picked on the owner's laptop has to be hosted somewhere public
// first. When a Vercel Blob store exists, Vercel injects BLOB_READ_WRITE_TOKEN
// automatically and this route uploads the file there and hands back its
// public URL. Without that token the route degrades to a clear JSON error and
// the composer still works fine by pasting an image URL instead, so nothing in
// the build or any page depends on the token existing.

import { NextRequest, NextResponse } from "next/server";
import { isAuthedRequest } from "@/lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — generous for a JPEG, sane for a short reel

export async function POST(req: NextRequest) {
  if (!(await isAuthedRequest())) {
    return NextResponse.json({ ok: false, error: "Not signed in. Reload the dashboard and log in again." }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "File upload is not configured on this deployment. Create a Blob store in the Vercel dashboard (Storage → Create → Blob) and redeploy, or paste a public image URL into the Media URL field instead.",
      },
      { status: 501 }
    );
  }

  let file: File | null = null;
  try {
    const formData = await req.formData();
    const entry = formData.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the uploaded file." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ ok: false, error: "No file was attached to the upload." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit here is 25 MB.` },
      { status: 413 }
    );
  }

  try {
    // Imported lazily so the Blob SDK is only loaded on a configured deployment.
    const { put } = await import("@vercel/blob");
    const safeName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "-");
    const blob = await put(`publish/${Date.now()}-${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `Upload failed: ${message}` }, { status: 502 });
  }
}
