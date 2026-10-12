"use client";

import { useState } from "react";
import { CHANNELS, type SocialChannel, type SocialPost } from "@/lib/sampleData";
import { formatShort } from "@/lib/dates";

// Known status words get a colour, anything else the owner types in the sheet
// shows as a plain neutral chip rather than disappearing.
const STATUS_CLASS: Record<string, string> = {
  Scheduled: "pending",
  Posted: "good",
  Draft: "neutral",
  "Needs Approval": "critical",
  Approved: "good",
  Completed: "good",
};

function statusClass(status: string): string {
  return STATUS_CLASS[status] ?? "neutral";
}

/** The date as typed when we could not read it as a date. */
function dateLabel(post: SocialPost): string {
  if (post.postDateIso) return formatShort(post.postDateIso, true);
  return post.postDateRaw || "Not set";
}

export default function PromoTabs({ posts }: { posts: SocialPost[] }) {
  const [active, setActive] = useState<SocialChannel>(CHANNELS[0].slug);

  // Rows whose Social value is not one of the six channels are kept out of the
  // tabs, and flagged underneath so nothing goes missing silently.
  const unmatched = posts.filter((p) => p.channel === null && p.channelName);
  const unmatchedNames = Array.from(new Set(unmatched.map((p) => p.channelName)));

  return (
    <>
      <div className="tab-nav" role="tablist" aria-label="Channel">
        {CHANNELS.map((c) => (
          <button
            key={c.slug}
            className={`tab-btn${active === c.slug ? " is-active" : ""}`}
            onClick={() => setActive(c.slug)}
            role="tab"
            aria-selected={active === c.slug}
          >
            {c.en}
            {c.cn && <span className="cn">{c.cn}</span>}
          </button>
        ))}
      </div>

      {CHANNELS.map((c) => {
        const byDate = (a: SocialPost, b: SocialPost) => (a.postDateIso < b.postDateIso ? -1 : 1);
        const channelPosts = posts.filter((p) => p.channel === c.slug);
        const upcoming = channelPosts.filter((p) => p.section === "upcoming").sort(byDate);
        // Completed posts are a drop-down on Instagram and Facebook only, newest first,
        // capped at the three most recent.
        const showCompleted = c.slug === "instagram" || c.slug === "facebook";
        const completedAll = channelPosts
          .filter((p) => p.section === "completed")
          .sort((a, b) => (a.postDateIso < b.postDateIso ? 1 : -1));
        const completed = completedAll.slice(0, 3);

        return (
          <div className="tab-panel" data-panel={c.slug} hidden={active !== c.slug} key={c.slug}>
            <div className="panel">
              <div className="panel-head">
                <h3 className="panel-title">Upcoming</h3>
                <span className="panel-note">
                  {upcoming.length} post{upcoming.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="panel-caption">
                From the Upcoming tab of the Social spreadsheet, soonest first.
              </p>
              {upcoming.length === 0 ? (
                <div className="empty-state">
                  <strong>No {c.en} posts planned yet</strong>
                  Add a row to the Upcoming tab with Social set to &ldquo;{c.en}&rdquo; and it will
                  appear here, soonest first.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="full-table">
                    <thead>
                      <tr>
                        <th>Post Date (HK)</th>
                        <th>Status</th>
                        <th>Topic / Type</th>
                        <th>Copy</th>
                        <th>Visual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.map((p, i) => (
                        <tr key={i}>
                          <td className="date-cell num">{dateLabel(p)}</td>
                          <td>
                            <span className={`status-chip ${statusClass(p.status)}`}>
                              {p.status || "Not set"}
                            </span>
                          </td>
                          <td className="cell-strong">{p.topic || "-"}</td>
                          <td className="cell-secondary wrap-cell">{p.copy || "-"}</td>
                          <td className="cell-secondary wrap-cell">{p.visual || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {showCompleted && (
            <details className="collapse-panel" style={{ marginTop: 16 }}>
              <summary className="collapse-bar">
                <span className="collapse-label">Latest completed posts</span>
                <span className="collapse-note">
                  {completedAll.length === 0
                    ? "none yet"
                    : `showing ${completed.length} of ${completedAll.length}`}
                </span>
              </summary>
              <div className="collapse-body">
              <p className="panel-caption">
                The three most recent from the Completed tab, newest first, with the engagement
                numbers recorded three days after posting.
              </p>
              {completed.length === 0 ? (
                <div className="empty-state">
                  <strong>Nothing posted on {c.en} yet</strong>
                  Once a post goes out and its row moves to the Completed tab, it will show here
                  with its link, views, hearts and comments.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="full-table">
                    <thead>
                      <tr>
                        <th>Post Date (HK)</th>
                        <th>Status</th>
                        <th>Topic / Type</th>
                        <th>Copy</th>
                        <th>Visual</th>
                        <th>Post Link</th>
                        <th>Views</th>
                        <th>Hearts</th>
                        <th>Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completed.map((p, i) => (
                        <tr key={i}>
                          <td className="date-cell num">{dateLabel(p)}</td>
                          <td>
                            <span className={`status-chip ${statusClass(p.status)}`}>
                              {p.status || "Not set"}
                            </span>
                          </td>
                          <td className="cell-strong">{p.topic || "-"}</td>
                          <td className="cell-secondary wrap-cell">{p.copy || "-"}</td>
                          <td className="cell-secondary wrap-cell">{p.visual || "-"}</td>
                          <td className="cell-secondary">
                            {p.postLink ? (
                              <a href={p.postLink} target="_blank" rel="noopener" className="cell-link">
                                View
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="cell-secondary num">{p.views || "-"}</td>
                          <td className="cell-secondary num">{p.hearts || "-"}</td>
                          <td className="cell-secondary num">{p.comments || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            </details>
            )}
          </div>
        );
      })}

      {unmatchedNames.length > 0 && (
        <div className="empty-state" style={{ marginTop: 20, textAlign: "left" }}>
          <strong>
            {unmatched.length} row{unmatched.length === 1 ? "" : "s"} are not on one of the six
            channel tabs
          </strong>
          Their Social column reads {unmatchedNames.map((n) => `"${n}"`).join(", ")}. Change those
          cells to Instagram, Facebook, LinkedIn, Website, Red Note or WeChat and the rows will move
          into the matching tab.
        </div>
      )}
    </>
  );
}
