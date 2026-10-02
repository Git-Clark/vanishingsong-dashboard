"use client";

import { useMemo, useRef, useState } from "react";

const CAPTION_LIMIT = 2200;
const CAPTION_WARN_AT = 2000;

type PostType = "image" | "reel";

interface DestinationOutcome {
  destination: "Instagram" | "Facebook";
  ok: boolean;
  id?: string;
  permalink?: string;
  error?: string;
}

interface ApiResponse {
  ok?: boolean;
  id?: string;
  permalink?: string;
  error?: string;
  url?: string;
}

async function readJson(res: Response): Promise<ApiResponse> {
  try {
    return (await res.json()) as ApiResponse;
  } catch {
    // Most likely the session expired and middleware redirected us to the
    // login page's HTML instead of JSON.
    return { ok: false, error: `Unexpected response (HTTP ${res.status}). Try reloading and logging in again.` };
  }
}

export default function PostComposer({
  igConnected,
  fbConnected,
  uploadEnabled,
}: {
  igConnected: boolean;
  fbConnected: boolean;
  uploadEnabled: boolean;
}) {
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [postType, setPostType] = useState<PostType>("image");
  const [toInstagram, setToInstagram] = useState(igConnected);
  const [toFacebook, setToFacebook] = useState(fbConnected);

  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Two-step publish: "edit" → "confirm" → "sending" → "done".
  const [stage, setStage] = useState<"edit" | "confirm" | "sending" | "done">("edit");
  const [formError, setFormError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<DestinationOutcome[]>([]);

  const overLimit = caption.length > CAPTION_LIMIT;
  const nearLimit = !overLimit && caption.length >= CAPTION_WARN_AT;
  const trimmedMedia = mediaUrl.trim();
  const isVideoPost = toInstagram && postType === "reel";

  const destinationNames = useMemo(() => {
    const names: string[] = [];
    if (toInstagram) names.push("Instagram");
    if (toFacebook) names.push("Facebook Page");
    return names;
  }, [toInstagram, toFacebook]);

  function validate(): string | null {
    if (!toInstagram && !toFacebook) return "Pick at least one destination.";
    if (overLimit) {
      return `The caption is ${caption.length} characters. Instagram's limit is ${CAPTION_LIMIT}, so trim ${
        caption.length - CAPTION_LIMIT
      }.`;
    }
    if (toInstagram && !trimmedMedia) {
      return "Instagram needs an image or video URL, it cannot post text on its own.";
    }
    if (toFacebook && !caption.trim() && !trimmedMedia) {
      return "A Facebook post needs a caption, an image, or both.";
    }
    if (trimmedMedia && !/^https:\/\//i.test(trimmedMedia)) {
      return "The media URL must be a public https:// URL that Meta's servers can reach.";
    }
    if (linkUrl.trim() && !/^https?:\/\//i.test(linkUrl.trim())) {
      return "The Facebook link must start with http:// or https://.";
    }
    return null;
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploadNote(null);
    if (!uploadEnabled) {
      setUploadError(
        "File upload is not set up on this deployment. Paste a public image URL into the Media URL field instead."
      );
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/publish/upload", { method: "POST", body: form });
      const data = await readJson(res);
      if (!res.ok || !data.ok || !data.url) {
        setUploadError(data.error || "Upload failed.");
      } else {
        setMediaUrl(data.url);
        setUploadNote(`Uploaded ${file.name}. Its public URL is now in the Media URL field.`);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleReview() {
    const problem = validate();
    setFormError(problem);
    if (problem) return;
    setOutcomes([]);
    setStage("confirm");
  }

  async function handlePublish() {
    setStage("sending");
    const results: DestinationOutcome[] = [];

    if (toInstagram) {
      try {
        const res = await fetch("/api/publish/instagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            postType === "reel"
              ? { videoUrl: trimmedMedia, caption }
              : { imageUrl: trimmedMedia, caption }
          ),
        });
        const data = await readJson(res);
        results.push(
          res.ok && data.ok
            ? { destination: "Instagram", ok: true, id: data.id, permalink: data.permalink }
            : { destination: "Instagram", ok: false, error: data.error || `HTTP ${res.status}` }
        );
      } catch (err) {
        results.push({
          destination: "Instagram",
          ok: false,
          error: err instanceof Error ? err.message : "Request failed.",
        });
      }
    }

    if (toFacebook) {
      try {
        // Facebook photo posts take an image URL; a reel's video URL is not a
        // valid photo, so a video post goes to the feed as a link instead.
        const fbImage = trimmedMedia && postType === "image" ? trimmedMedia : undefined;
        const fbLink = linkUrl.trim() || (postType === "reel" ? trimmedMedia || undefined : undefined);
        const res = await fetch("/api/publish/facebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: caption, imageUrl: fbImage, link: fbLink }),
        });
        const data = await readJson(res);
        results.push(
          res.ok && data.ok
            ? { destination: "Facebook", ok: true, id: data.id, permalink: data.permalink }
            : { destination: "Facebook", ok: false, error: data.error || `HTTP ${res.status}` }
        );
      } catch (err) {
        results.push({
          destination: "Facebook",
          ok: false,
          error: err instanceof Error ? err.message : "Request failed.",
        });
      }
    }

    setOutcomes(results);
    setStage("done");
  }

  function startNewPost() {
    setCaption("");
    setMediaUrl("");
    setLinkUrl("");
    setUploadNote(null);
    setUploadError(null);
    setFormError(null);
    setOutcomes([]);
    setStage("edit");
  }

  const succeeded = outcomes.filter((o) => o.ok);
  const failed = outcomes.filter((o) => !o.ok);

  // ---- results view ----
  if (stage === "done") {
    return (
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            {failed.length === 0
              ? "Published"
              : succeeded.length === 0
                ? "Nothing was published"
                : "Partly published"}
          </div>
          <div className="panel-note">{destinationNames.join(" + ")}</div>
        </div>
        <div className="panel-caption">
          {failed.length === 0
            ? "Both the caption and media went out as previewed."
            : succeeded.length === 0
              ? "No post was created. Fix the error below and try again."
              : "One destination went out and one did not. Only retry the one that failed, or you will double-post."}
        </div>

        <ul className="result-list">
          {outcomes.map((o) => (
            <li key={o.destination} className="result-row">
              <span className={`status-chip ${o.ok ? "good" : "critical"}`}>
                {o.destination} · {o.ok ? "Posted" : "Failed"}
              </span>
              <div className="result-body">
                {o.ok ? (
                  <>
                    <div className="result-id num">Post ID {o.id}</div>
                    {o.permalink && (
                      <a className="result-link" href={o.permalink} target="_blank" rel="noopener">
                        View on {o.destination}
                      </a>
                    )}
                  </>
                ) : (
                  <div className="result-error">{o.error}</div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="compose-actions">
          <button type="button" className="compose-btn" onClick={startNewPost}>
            Write another post
          </button>
          {failed.length > 0 && (
            <button type="button" className="compose-btn ghost" onClick={() => setStage("edit")}>
              Back to the draft
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- confirm view ----
  if (stage === "confirm" || stage === "sending") {
    const sending = stage === "sending";
    return (
      <div className="panel confirm-panel">
        <div className="panel-head">
          <div className="panel-title">Confirm before publishing</div>
          <div className="panel-note">Step 2 of 2</div>
        </div>
        <div className="panel-caption">
          This posts to the film&rsquo;s live public {destinationNames.length > 1 ? "accounts" : "account"}
          {" "}immediately. Read it once more.
        </div>

        <div className="confirm-grid">
          <div>
            <div className="compose-label">Posting to</div>
            <div className="confirm-dests">
              {destinationNames.map((name) => (
                <span key={name} className="status-chip confirmed">
                  {name}
                  {name === "Instagram" ? ` · ${postType === "reel" ? "Reel" : "Image post"}` : ""}
                </span>
              ))}
            </div>

            <div className="compose-label" style={{ marginTop: 18 }}>
              Caption ({caption.length} characters)
            </div>
            <div className="confirm-caption">{caption.trim() || "(no caption)"}</div>

            {linkUrl.trim() && (
              <>
                <div className="compose-label" style={{ marginTop: 18 }}>
                  Facebook link attachment
                </div>
                <div className="confirm-url">{linkUrl.trim()}</div>
              </>
            )}
          </div>

          <div>
            <div className="compose-label">{isVideoPost ? "Video" : "Image"}</div>
            {trimmedMedia ? (
              <>
                {isVideoPost ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption -- preview only, not published media
                  <video className="confirm-media" src={trimmedMedia} controls preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- an arbitrary
                  // external URL the owner pasted; next/image would need a remote
                  // pattern allowlist we cannot know ahead of time.
                  <img className="confirm-media" src={trimmedMedia} alt="Preview of the image to be published" />
                )}
                <div className="confirm-url">{trimmedMedia}</div>
              </>
            ) : (
              <div className="empty-state">
                <strong>Text-only post</strong>
                No media attached. Facebook accepts this; Instagram does not.
              </div>
            )}
          </div>
        </div>

        <div className="compose-actions">
          <button type="button" className="compose-btn danger" onClick={handlePublish} disabled={sending}>
            {sending ? "Publishing…" : "Yes, publish now"}
          </button>
          <button
            type="button"
            className="compose-btn ghost"
            onClick={() => setStage("edit")}
            disabled={sending}
          >
            Cancel, keep editing
          </button>
        </div>
        {sending && (
          <div className="compose-hint">
            Sending. A reel can take up to a minute while Instagram processes the video, so don&rsquo;t
            reload this page.
          </div>
        )}
      </div>
    );
  }

  // ---- edit view ----
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Compose</div>
        <div className="panel-note">Step 1 of 2 · nothing is sent yet</div>
      </div>
      <div className="panel-caption">
        Write the post, then review a preview of exactly what goes out before anything is published.
      </div>

      <div className="compose-field">
        <div className="compose-label-row">
          <label className="compose-label" htmlFor="caption">
            Caption
          </label>
          <span
            className={`char-counter${overLimit ? " is-over" : nearLimit ? " is-near" : ""}`}
            aria-live="polite"
          >
            {caption.length} / {CAPTION_LIMIT}
          </span>
        </div>
        <textarea
          id="caption"
          className="compose-input compose-textarea"
          rows={7}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="The caption as it will appear, hashtags and all."
        />
        {overLimit && (
          <div className="compose-error">
            Over Instagram&rsquo;s {CAPTION_LIMIT}-character limit by {caption.length - CAPTION_LIMIT}.
          </div>
        )}
      </div>

      <div className="compose-field">
        <label className="compose-label" htmlFor="mediaUrl">
          Media URL (public https, JPEG for images)
        </label>
        <input
          id="mediaUrl"
          className="compose-input"
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://…/still.jpg"
        />
        <div className="compose-hint">
          Instagram&rsquo;s API only fetches public URLs, it never takes a file directly.
          {uploadEnabled
            ? " Pick a file below and it will be hosted for you."
            : " File upload is not set up on this deployment, so paste a URL here."}
        </div>
      </div>

      <div className="compose-field">
        <label className="compose-label" htmlFor="mediaFile">
          Or upload a file {uploadEnabled ? "" : "(not configured)"}
        </label>
        <input
          id="mediaFile"
          ref={fileInputRef}
          className="compose-input compose-file"
          type="file"
          accept="image/jpeg,image/png,video/mp4,video/quicktime"
          disabled={!uploadEnabled || uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploading && <div className="compose-hint">Uploading…</div>}
        {uploadNote && <div className="compose-note-good">{uploadNote}</div>}
        {uploadError && <div className="compose-error">{uploadError}</div>}
      </div>

      <div className="compose-field">
        <div className="compose-label">Destinations</div>
        <div className="dest-row">
          <label className={`dest-option${toInstagram ? " is-on" : ""}`}>
            <input
              type="checkbox"
              checked={toInstagram}
              onChange={(e) => setToInstagram(e.target.checked)}
            />
            Instagram
            {!igConnected && <span className="dest-warn">not connected</span>}
          </label>
          <label className={`dest-option${toFacebook ? " is-on" : ""}`}>
            <input
              type="checkbox"
              checked={toFacebook}
              onChange={(e) => setToFacebook(e.target.checked)}
            />
            Facebook Page
            {!fbConnected && <span className="dest-warn">not connected</span>}
          </label>
        </div>
      </div>

      {toInstagram && (
        <div className="compose-field">
          <div className="compose-label">Instagram post type</div>
          <div className="filter-row" role="radiogroup" aria-label="Instagram post type">
            <button
              type="button"
              role="radio"
              aria-checked={postType === "image"}
              className={`filter-pill${postType === "image" ? " is-active" : ""}`}
              onClick={() => setPostType("image")}
            >
              Image
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={postType === "reel"}
              className={`filter-pill${postType === "reel" ? " is-active" : ""}`}
              onClick={() => setPostType("reel")}
            >
              Reel / video
            </button>
          </div>
        </div>
      )}

      {toFacebook && (
        <div className="compose-field">
          <label className="compose-label" htmlFor="linkUrl">
            Facebook link attachment (optional)
          </label>
          <input
            id="linkUrl"
            className="compose-input"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://thevanishingsong.com"
          />
          <div className="compose-hint">
            Used only when the Facebook post has no image. Instagram ignores it.
          </div>
        </div>
      )}

      {formError && <div className="compose-error">{formError}</div>}

      <div className="compose-actions">
        <button type="button" className="compose-btn" onClick={handleReview}>
          Review &amp; publish
        </button>
      </div>
    </div>
  );
}
