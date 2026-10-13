import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { getFestivals, getMediaList, getPriorities, getSocialPosts } from "@/lib/sheets";
import { CHANNELS } from "@/lib/sampleData";
import { daysUntil, formatShort, todayHK } from "@/lib/dates";

export const revalidate = 300; // 5 min ISR, reflects sheet edits without a redeploy

const STATUS_CLASS: Record<string, string> = {
  Pending: "pending",
  "Not accepted": "critical",
  Accepted: "good",
};

// Illustrative-only outreach status pattern for the Media Outreach panel,
// the Media Contacts sheet doesn't have Content Type / Status columns yet
// (see the panel caption), so we cycle a small placeholder pattern over
// whichever contacts come back from getContacts().
const OUTREACH_PATTERN: { label: string; cls: string }[] = [
  { label: "Responded", cls: "good" },
  { label: "Contacted", cls: "pending" },
  { label: "Not Contacted", cls: "neutral" },
];

export default async function HomePage() {
  const [festivals, mediaContacts, socialPosts, priorities] = await Promise.all([
    getFestivals(),
    getMediaList(),
    getSocialPosts(),
    getPriorities(),
  ]);

  const today = todayHK();

  // ---- Upcoming Notifications table (next 5) ----
  const nextFive = festivals
    .filter((f) => f.notifyIso && daysUntil(f.notifyIso, today) >= 0)
    .sort((a, b) => (a.notifyIso! < b.notifyIso! ? -1 : 1))
    .slice(0, 5);

  // ---- Upcoming Scheduled Posts ----
  const upcomingPosts = socialPosts
    .filter((p) => p.postDateIso && daysUntil(p.postDateIso, today) >= 0)
    .sort((a, b) => (a.postDateIso < b.postDateIso ? -1 : 1))
    .slice(0, 5);

  // ---- Media Outreach (illustrative) ----
  // Home is a snapshot, so show only the first few. The full directory of 113
  // contacts lives on the Media Contacts page.
  const flatContacts = mediaContacts.slice(0, 5);

  return (
    <div className="page">
      <Masthead variant="home" />

      <section className="content-grid">
        <div className="col">
          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">This Week&rsquo;s Priorities</h2>
              <span className="panel-note">
                {priorities.length === 0
                  ? "Set by the team"
                  : `${priorities.length} this week`}
              </span>
            </div>
            <p className="panel-caption">
              Read live from the This Week&rsquo;s Priorities sheet, in the order they are listed
              there.
            </p>
            {priorities.length === 0 ? (
              <div className="empty-state">
                <strong>No priorities listed yet</strong>
                This panel reads column A of the <code>Sheet1</code> tab of the This Week&rsquo;s
                Priorities spreadsheet, from row 2 down. Share that spreadsheet with the
                dashboard&rsquo;s service account and set <code>PRIORITIES_SHEET_ID</code>, and every
                row will appear here within a few minutes.
              </div>
            ) : (
              <ul className="priority-list">
                {priorities.map((item, i) => (
                  <li key={i}>
                    <span className="checkbox"></span> {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Upcoming Notifications</h2>
              <span className="panel-note">
                Next {nextFive.length} of {festivals.length}
              </span>
            </div>
            <p className="panel-caption">When we expect to hear back. All of these are already submitted.</p>
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
                      <div className="fest-name">{p.topic || p.channelName}</div>
                      <div className="fest-loc">
                        {formatShort(p.postDateIso)} · {p.channelName}
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
              <span className="panel-note">
                {flatContacts.length} of {mediaContacts.length}
              </span>
            </div>
            <p className="panel-caption">
              The first few from the Media List. Status is illustrative until the sheet carries an
              outreach status column. Full directory on the Media Contacts page.
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
                        <td className="cell-strong">{c.organization}</td>
                        <td className="cell-secondary">{c.name}</td>
                        <td className="cell-secondary">{c.contentType || "-"}</td>
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
