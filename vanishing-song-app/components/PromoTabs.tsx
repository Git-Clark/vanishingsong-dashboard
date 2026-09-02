"use client";

import { useState } from "react";
import { CHANNELS, type SocialChannel, type SocialPost } from "@/lib/sampleData";
import { formatShort } from "@/lib/dates";

const STATUS_CLASS: Record<string, string> = {
  Scheduled: "pending",
  Posted: "good",
  Draft: "neutral",
  "Needs Approval": "critical",
};

export default function PromoTabs({ posts }: { posts: SocialPost[] }) {
  const [active, setActive] = useState<SocialChannel>(CHANNELS[0].slug);

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
        const channelPosts = posts
          .filter((p) => p.channel === c.slug)
          .sort((a, b) => (a.postDateIso < b.postDateIso ? -1 : 1));

        return (
          <div className="tab-panel" data-panel={c.slug} hidden={active !== c.slug} key={c.slug}>
            {channelPosts.length === 0 ? (
              <>
                <div className="post-columns">
                  <span>Post Date (HK)</span>
                  <span>Status</span>
                  <span>Topic / Type</span>
                  <span>Copy</span>
                  <span>Visual</span>
                  <span>Post Link</span>
                </div>
                <div className="empty-state">
                  <strong>No {c.en} posts scheduled yet</strong>
                  Add rows to the Social Media Campaign sheet with Channel set to &ldquo;{c.en}&rdquo;
                  and they&rsquo;ll appear here, soonest first.
                </div>
              </>
            ) : (
              <div className="panel">
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
                      </tr>
                    </thead>
                    <tbody>
                      {channelPosts.map((p, i) => (
                        <tr key={i}>
                          <td className="date-cell num">{formatShort(p.postDateIso)}</td>
                          <td>
                            <span className={`status-chip ${STATUS_CLASS[p.status] ?? "neutral"}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="cell-strong">{p.topic}</td>
                          <td className="cell-secondary">{p.copy}</td>
                          <td className="cell-secondary">{p.visual}</td>
                          <td className="cell-secondary">
                            {p.postLink ? (
                              <a href={p.postLink} target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>
                                View
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
