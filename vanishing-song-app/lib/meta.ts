// Server-side Meta Graph API client (Instagram + Facebook Page publishing).
//
// Mirrors lib/sheets.ts's graceful-degradation contract: nothing here throws
// at import time or when env vars are missing. Every exported function either
// returns a typed success value or a typed error object, so a page can render
// a calm "not configured yet" state instead of a crash.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   META_PAGE_ACCESS_TOKEN  long-lived Page Access Token (does not expire)
//   META_PAGE_ID            the Facebook Page's numeric ID
//   META_IG_USER_ID         the linked Instagram professional account's IG User ID
//   META_GRAPH_VERSION      optional, defaults to v26.0
//
// Because the accounts are owned/managed by the film's team, Standard Access
// (development mode) is enough — no Meta app review is needed.

const DEFAULT_GRAPH_VERSION = "v26.0";

/** Instagram's hard caption limit, counted in characters. */
export const IG_CAPTION_LIMIT = 2200;

/** Reel processing poll settings — Meta transcodes video asynchronously. */
const REEL_POLL_INTERVAL_MS = 3000;
const REEL_POLL_TIMEOUT_MS = 60000;

export interface MetaConfig {
  token: string;
  pageId: string;
  igUserId: string;
  version: string;
}

export interface PlatformStatus {
  connected: boolean;
  pageName?: string;
  username?: string;
  error?: string;
}

export interface ConnectionStatus {
  /** True when the three required env vars are present. */
  configured: boolean;
  facebook: { connected: boolean; pageName?: string; error?: string };
  instagram: { connected: boolean; username?: string; error?: string };
}

export type PublishResult =
  | { ok: true; id: string; permalink?: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------- config ----

function readConfig(): MetaConfig | null {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const igUserId = process.env.META_IG_USER_ID;
  const version = process.env.META_GRAPH_VERSION || DEFAULT_GRAPH_VERSION;
  if (!token || !pageId || !igUserId) return null;
  return { token, pageId, igUserId, version };
}

/** True when all three required Meta env vars are set. Safe to call anywhere. */
export function isMetaConfigured(): boolean {
  return readConfig() !== null;
}

function graphUrl(version: string, path: string): string {
  return `https://graph.facebook.com/${version}/${path.replace(/^\//, "")}`;
}

// ----------------------------------------------------------- error shapes ----

interface GraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

/**
 * Flattens Meta's error envelope into one readable line. Meta's own
 * `error.message` text is usually actionable ("The image is not a valid
 * JPEG", "Invalid OAuth access token"), so it leads.
 */
function formatGraphError(body: unknown, httpStatus: number): string {
  const err = (body as GraphErrorBody | null)?.error;
  if (!err) return `Meta returned HTTP ${httpStatus} with no error details.`;
  const bits: string[] = [];
  if (err.message) bits.push(err.message);
  const codes = [
    err.code !== undefined ? `code ${err.code}` : null,
    err.error_subcode !== undefined ? `subcode ${err.error_subcode}` : null,
    err.type ? err.type : null,
  ].filter(Boolean);
  if (codes.length) bits.push(`(${codes.join(", ")})`);
  if (err.fbtrace_id) bits.push(`[trace ${err.fbtrace_id}]`);
  return bits.join(" ") || `Meta returned HTTP ${httpStatus}.`;
}

function describeThrown(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// ------------------------------------------------------------- transport ----

type GraphCall<T> = { ok: true; data: T } | { ok: false; error: string };

async function graphGet<T>(config: MetaConfig, path: string, fields?: string): Promise<GraphCall<T>> {
  const url = new URL(graphUrl(config.version, path));
  if (fields) url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", config.token);
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: formatGraphError(body, res.status) };
    return { ok: true, data: body as T };
  } catch (err) {
    return { ok: false, error: `Could not reach Meta: ${describeThrown(err)}` };
  }
}

/**
 * POSTs params as an URL-encoded request body rather than a query string, so a
 * 2200-character caption can never run into a URL length limit.
 */
async function graphPost<T>(
  config: MetaConfig,
  path: string,
  params: Record<string, string>
): Promise<GraphCall<T>> {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") form.set(k, v);
  }
  form.set("access_token", config.token);
  try {
    const res = await fetch(graphUrl(config.version, path), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: formatGraphError(body, res.status) };
    return { ok: true, data: body as T };
  } catch (err) {
    return { ok: false, error: `Could not reach Meta: ${describeThrown(err)}` };
  }
}

// ------------------------------------------------------ connection status ----

/**
 * Checks the token against both destinations. Never throws — this renders on
 * the /publish page, so failures come back inside the returned object.
 */
export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const config = readConfig();
  if (!config) {
    return {
      configured: false,
      facebook: { connected: false, error: "Not configured" },
      instagram: { connected: false, error: "Not configured" },
    };
  }

  // GET /me?fields=id,name — confirms the Page Access Token works and names the Page.
  const me = await graphGet<{ id?: string; name?: string }>(config, "me", "id,name");

  // GET /{page-id}?fields=instagram_business_account{id,username} — confirms the
  // Instagram professional account linked to that Page.
  const linked = await graphGet<{
    instagram_business_account?: { id?: string; username?: string };
  }>(config, config.pageId, "instagram_business_account{id,username}");

  const facebook = me.ok
    ? { connected: true, pageName: me.data.name || `Page ${config.pageId}` }
    : { connected: false, error: me.error };

  let instagram: ConnectionStatus["instagram"];
  if (!linked.ok) {
    instagram = { connected: false, error: linked.error };
  } else {
    const ig = linked.data.instagram_business_account;
    if (!ig?.id) {
      instagram = {
        connected: false,
        error:
          "No Instagram professional account is linked to this Facebook Page. Link it in Meta Business Suite, then reload.",
      };
    } else if (ig.id !== config.igUserId) {
      instagram = {
        connected: false,
        error: `The Page links Instagram account ${ig.id}, but META_IG_USER_ID is set to ${config.igUserId}. Update the env var to match.`,
      };
    } else {
      instagram = { connected: true, username: ig.username };
    }
  }

  return { configured: true, facebook, instagram };
}

// ------------------------------------------------------------- instagram ----

function validateCaption(caption: string): string | null {
  if (caption.length > IG_CAPTION_LIMIT) {
    return `Caption is ${caption.length} characters — Instagram's limit is ${IG_CAPTION_LIMIT}. Trim it by ${
      caption.length - IG_CAPTION_LIMIT
    }.`;
  }
  return null;
}

/**
 * media_publish returns only the media id, so the real post URL has to be read
 * back from the media's own `permalink` field. Returns undefined rather than a
 * guessed URL if that read fails — a dead link is worse than no link, and the
 * post itself has already succeeded by this point either way.
 */
async function fetchIgPermalink(config: MetaConfig, mediaId: string): Promise<string | undefined> {
  const res = await graphGet<{ permalink?: string }>(config, mediaId, "permalink");
  return res.ok ? res.data.permalink : undefined;
}

/**
 * Publishes a single image to Instagram — a two-step container flow, in this
 * order: create the media container, then publish it.
 *
 * `imageUrl` must be a public URL that Meta's servers can fetch themselves
 * (the API never accepts raw file bytes), and Instagram only reliably accepts
 * JPEG. A Vercel Blob URL, or any public https image URL, works.
 */
export async function publishToInstagram({
  imageUrl,
  caption,
}: {
  imageUrl: string;
  caption: string;
}): Promise<PublishResult> {
  const config = readConfig();
  if (!config) return { ok: false, error: "Instagram publishing is not configured on this deployment." };
  if (!imageUrl) return { ok: false, error: "An image URL is required for an Instagram image post." };

  const captionError = validateCaption(caption);
  if (captionError) return { ok: false, error: captionError };

  // Step 1 — create the media container.
  const container = await graphPost<{ id?: string }>(config, `${config.igUserId}/media`, {
    image_url: imageUrl,
    caption,
  });
  if (!container.ok) return { ok: false, error: container.error };
  const creationId = container.data.id;
  if (!creationId) return { ok: false, error: "Meta accepted the image but returned no creation id." };

  // Step 2 — publish that container.
  const published = await graphPost<{ id?: string }>(config, `${config.igUserId}/media_publish`, {
    creation_id: creationId,
  });
  if (!published.ok) return { ok: false, error: published.error };
  if (!published.data.id) return { ok: false, error: "Meta published the post but returned no media id." };

  return {
    ok: true,
    id: published.data.id,
    permalink: await fetchIgPermalink(config, published.data.id),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Publishes a video as an Instagram Reel. Same container flow as an image, but
 * Meta transcodes the video asynchronously, so the container has to report
 * FINISHED before it can be published.
 *
 * `videoUrl` must be a public URL Meta's servers can fetch (MP4/MOV).
 */
export async function publishReelToInstagram({
  videoUrl,
  caption,
}: {
  videoUrl: string;
  caption: string;
}): Promise<PublishResult> {
  const config = readConfig();
  if (!config) return { ok: false, error: "Instagram publishing is not configured on this deployment." };
  if (!videoUrl) return { ok: false, error: "A video URL is required for an Instagram reel." };

  const captionError = validateCaption(caption);
  if (captionError) return { ok: false, error: captionError };

  // Step 1 — create the REELS container.
  const container = await graphPost<{ id?: string }>(config, `${config.igUserId}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
  });
  if (!container.ok) return { ok: false, error: container.error };
  const creationId = container.data.id;
  if (!creationId) return { ok: false, error: "Meta accepted the video but returned no creation id." };

  // Step 2 — poll until the upload has finished transcoding.
  const deadline = Date.now() + REEL_POLL_TIMEOUT_MS;
  let lastStatus = "";
  while (Date.now() < deadline) {
    await sleep(REEL_POLL_INTERVAL_MS);
    const check = await graphGet<{ status_code?: string; status?: string }>(
      config,
      creationId,
      "status_code,status"
    );
    if (!check.ok) return { ok: false, error: check.error };
    const code = check.data.status_code ?? "";
    lastStatus = check.data.status ?? lastStatus;
    if (code === "FINISHED") break;
    if (code === "ERROR") {
      return {
        ok: false,
        error: lastStatus
          ? `Instagram could not process the video: ${lastStatus}`
          : "Instagram could not process the video. Check that it is an MP4 that meets Reels' length and aspect-ratio rules.",
      };
    }
    if (Date.now() >= deadline) break;
  }

  // Confirm it actually finished rather than falling out of the loop on timeout.
  const final = await graphGet<{ status_code?: string; status?: string }>(
    config,
    creationId,
    "status_code,status"
  );
  if (!final.ok) return { ok: false, error: final.error };
  if (final.data.status_code !== "FINISHED") {
    return {
      ok: false,
      error:
        "Instagram is still processing the video after 60 seconds, so it was not published. Nothing was posted — wait a few minutes and try again, or check Instagram directly before re-posting.",
    };
  }

  // Step 3 — publish the finished container.
  const published = await graphPost<{ id?: string }>(config, `${config.igUserId}/media_publish`, {
    creation_id: creationId,
  });
  if (!published.ok) return { ok: false, error: published.error };
  if (!published.data.id) return { ok: false, error: "Meta published the reel but returned no media id." };

  return {
    ok: true,
    id: published.data.id,
    permalink: await fetchIgPermalink(config, published.data.id),
  };
}

// -------------------------------------------------------------- facebook ----

/**
 * Posts to the Facebook Page. With an image URL it becomes a photo post
 * (/photos, where `url` is the image Meta fetches); otherwise a feed post,
 * optionally with a link attachment.
 */
export async function publishToFacebook({
  message,
  imageUrl,
  link,
}: {
  message: string;
  imageUrl?: string;
  link?: string;
}): Promise<PublishResult> {
  const config = readConfig();
  if (!config) return { ok: false, error: "Facebook publishing is not configured on this deployment." };
  if (!message && !imageUrl) {
    return { ok: false, error: "A Facebook post needs a message, an image, or both." };
  }

  if (imageUrl) {
    const photo = await graphPost<{ id?: string; post_id?: string }>(config, `${config.pageId}/photos`, {
      url: imageUrl,
      message,
    });
    if (!photo.ok) return { ok: false, error: photo.error };
    const id = photo.data.post_id || photo.data.id;
    if (!id) return { ok: false, error: "Meta published the photo but returned no post id." };
    return { ok: true, id, permalink: `https://www.facebook.com/${id}` };
  }

  const feed = await graphPost<{ id?: string }>(config, `${config.pageId}/feed`, {
    message,
    ...(link ? { link } : {}),
  });
  if (!feed.ok) return { ok: false, error: feed.error };
  if (!feed.data.id) return { ok: false, error: "Meta published the post but returned no post id." };
  return { ok: true, id: feed.data.id, permalink: `https://www.facebook.com/${feed.data.id}` };
}
