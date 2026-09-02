import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { getFestivals, getContacts, getSocialPosts } from "@/lib/sheets";
import { CHANNELS } from "@/lib/sampleData";
import { daysUntil, formatShort, parseIsoDate, todayHK } from "@/lib/dates";

export const revalidate = 300; // 5 min ISR — reflects sheet edits without a redeploy

const STATUS_CLASS: Record<string, string> = {
  Pending: "pending",
  "Not accepted": "critical",
  Accepted: "good",
};

// Illustrative-only outreach status pattern for the Media Outreach panel —
// the Media Contacts sheet doesn't have Content Type / Status columns yet
// (see the panel caption), so we cycle a small placeholder pattern over
// whichever contacts come back from getContacts().
const OUTREACH_PATTERN: { label: string; cls: string }[] = [
  { label: "Responded", cls: "good" },
  { label: "Contacted", cls: "pending" },
  { label: "Not Contacted", cls: "neutral" },
];

export default async function HomePage() {
  const [festivals, contactRegions, socialPosts] = await Promise.all([
    getFestivals(),
    getContacts(),
    getSocialPosts(),
  ]);

  const today = todayHK();

  // ---- Next Notification ----
  const upcomingNotifies = festivals
    .filter((f) => f.notifyIso && daysUntil(f.notifyIso, today) >= 0)
    .sort((a, b) => (a.notifyIso! < b.notifyIso! ? -1 : 1));
  const nextNotify = upcomingNotifies[0];
  const nextNotifyDays = nextNotify ? daysUntil(nextNotify.notifyIso!, today) : null;

  // ---- Pending Decisions ----
  const pendingCount = festivals.filter((f) => f.status === "Pending").length;
  const decided = festivals.filter((f) => f.status !== "Pending");
  const pendingSub =
    decided.length === 0
      ? "No decisions received yet"
      : `${decided.length} decision${decided.length === 1 ? "" : "s"} received so far (${decided
          .map((f) => f.name)
          .join(", ")})`;

  // ---- Events This Month ----
  const thisMonthEvents = festivals.filter((f) => {
    if (!f.eventIso) return false;
    const dt = parseIsoDate(f.eventIso);
    return dt.getUTCFullYear() === today.getUTCFullYear() && dt.getUTCMonth() === today.getUTCMonth();
  });
  const activeThisMonth = thisMonthEvents.filter((f) => f.status !== "Not accepted");
  const declinedThisMonth = thisMonthEvents.filter((f) => f.status === "Not accepted");
  let eventsSub: string;
  if (activeThisMonth.length === 0) {
    eventsSub = "No confirmed events on the calendar this month";
  } else {
    eventsSub = activeThisMonth.map((f) => `${f.name}, ${formatShort(f.eventIso)}`).join("; ");
  }
  if (declinedThisMonth.length) {
    eventsSub += ` — ${declinedThisMonth
      .map((f) => `${f.name} passed on us ${formatShort(f.eventIso)}`)
      .join("; ")}`;
  }

  // ---- Upcoming Notifications table (next 5) ----
  const nextFive = upcomingNotifies.slice(0, 5);

  // ---- Upcoming Scheduled Posts ----
  const upcomingPosts = socialPosts
    .filter((p) => p.postDateIso && daysUntil(p.postDateIso, today) >= 0)
    .sort((a, b) => (a.postDateIso < b.postDateIso ? -1 : 1))
    .slice(0, 5);

  // ---- Media Outreach (illustrative) ----
  const flatContacts = contactRegions.flatMap((r) => r.contacts);

  return (
    <div className="page">
      <Masthead variant="home" />

      <section className="stat-grid" aria-label="Key metrics">
        <div className="stat-card accent">
          <div className="stat-label">Next Notification</div>
          <div className="stat-value num">
            {nextNotify ? (
              <>
                {formatShort(nextNotify.notifyIso!)}{" "}
                <small>
                  · {nextNotifyDays} day{nextNotifyDays === 1 ? "" : "s"}
                </small>
              </>
            ) : (
              "—"
            )}
          </div>
          <div className="stat-sub">{nextNotify ? nextNotify.name : "No upcoming notifications on file"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Festivals Tracked</div>
          <div className="stat-value num">{festivals.length}</div>
          <div className="stat-sub">Across the full submission schedule</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Decisions</div>
          <div className="stat-value num">{pendingCount}</div>
          <div className="stat-sub">{pendingSub}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Events This Month</div>
          <div className="stat-value num">{activeThisMonth.length}</div>
          <div className="stat-sub">{eventsSub}</div>
        </div>
      </section>

      <section className="content-grid">
        <div className="col">
          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">This Week&rsquo;s Priorities</h2>
              <span className="panel-note">Set by the team</span>
            </div>
            <p className="panel-caption">Manually updated, not pulled from a sheet.</p>
            <ul className="priority-list">
              <li>
                <span className="checkbox"></span> Follow up on New Hampshire Film Festival and IDFA
                <span className="priority-tag">Notified Sep 1</span>
              </li>
              <li>
                <span className="checkbox"></span> Finish outreach prep for Wildlife Conservation Film
                Festival ahead of its Sep 7 notification
              </li>
              <li>
                <span className="checkbox"></span> Confirm next steps following Telluride&rsquo;s decision
              </li>
              <li>
                <span className="checkbox"></span> Review Instagram and Facebook launch teaser copy ahead
                of festival season
              </li>
            </ul>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Upcoming Notifications</h2>
              <span className="panel-note">
                Next {nextFive.length} of {festivals.length}
              </span>
            </div>
            <p className="panel-caption">When we expect to hear back — all of these are already submitted.</p>
            <div className="table-wrap">
              <table className="deadlines">
                <thead>
                  <tr>
                    <th>Festival</th>
                    <th>Notifies</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nextFive.map((f) => {
                    const soon = daysUntil(f.notifyIso!, today) <= 7;
                    return (
                      <tr key={f.name}>
                        <td>
                          <div className="fest-name">{f.name}</div>
                          <div className="fest-loc">{f.location}</div>
                        </td>
                        <td className={`date-cell num${soon ? " date-soon" : ""}`}>
                          {formatShort(f.notifyIso!)}
                        </td>
                        <td>
                          <span className={`status-chip ${STATUS_CLASS[f.status]}`}>{f.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {nextFive.length === 0 && (
                    <tr>
                      <td colSpan={3} className="cell-secondary">
                        No upcoming notifications on file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Upcoming Scheduled Posts</h2>
              <span className="panel-note">{upcomingPosts.length} upcoming</span>
            </div>
            <p className="panel-caption">Next posts across all 6 channels, soonest first.</p>
            {upcomingPosts.length === 0 ? (
              <div className="empty-state">
                <strong>No posts scheduled yet</strong>
                Add rows to the Social Media Campaign sheet and the next few posts will appear here,
                soonest first.
              </div>
            ) : (
              <ul className="priority-list">
                {upcomingPosts.map((p, i) => (
                  <li key={i}>
                    <span className="checkbox"></span>
                    <div>
                      <div className="fest-name">{p.topic || p.channel}</div>
                      <div className="fest-loc">
                        {formatShort(p.postDateIso)} · {p.channel}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="channel-grid">
              {CHANNELS.map((c) => (
                <div className="channel-chip" key={c.slug}>
                  <span className="en">{c.en}</span>
                  {c.cn && <span className="cn">{c.cn}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Media Outreach</h2>
              <span className="panel-note">{flatContacts.length} contacts</span>
            </div>
            <p className="panel-caption">
              Illustrative — needs Content Type and Status columns on the Media Contacts sheet to go
              live.
            </p>
            <div className="table-wrap">
              <table className="outreach">
                <thead>
                  <tr>
                    <th>Media Organization</th>
                    <th>Name</th>
                    <th>Content Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {flatContacts.map((c, i) => {
                    const outreach = OUTREACH_PATTERN[i % OUTREACH_PATTERN.length];
                    return (
                      <tr key={c.email || i}>
                        <td className="cell-strong">{c.publication}</td>
                        <td className="cell-secondary">{c.name}</td>
                        <td className="cell-secondary">Print</td>
                        <td>
                          <span className={`status-chip ${outreach.cls}`}>{outreach.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
