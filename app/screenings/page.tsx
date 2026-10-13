import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import TableModalButton from "@/components/TableModalButton";
import { getUpcomingScreenings, getCompletedScreenings } from "@/lib/sheets";
import { formatShort } from "@/lib/dates";
import type { ScreeningStatus } from "@/lib/sheets";

export const revalidate = 300; // 5 min ISR, reflects sheet edits without a redeploy

// The Confirmed column takes three values. They map onto the chip styles the
// rest of the dashboard already uses.
const STATUS_CLASS: Record<ScreeningStatus, string> = {
  Confirmed: "good",
  Pending: "pending",
  "Not Contacted": "neutral",
};

const COMPLETED_COLUMNS = [
  "Date",
  "Location",
  "Theater / Organization",
  "Size",
  "Contact Person",
  "Contact Info",
  "Notes",
];

/** A website cell is linked only when it actually looks like a web address. */
function toHref(value: string): string | null {
  const v = value.trim();
  if (!v || /\s/.test(v)) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(v)) return `https://${v}`;
  return null;
}

export default async function ScreeningsPage() {
  const [upcoming, completed] = await Promise.all([
    getUpcomingScreenings(),
    getCompletedScreenings(),
  ]);

  // Soonest first, rows without a readable date at the end.
  const sorted = [...upcoming].sort((a, b) => {
    if (!a.dateIso && !b.dateIso) return 0;
    if (!a.dateIso) return 1;
    if (!b.dateIso) return -1;
    return a.dateIso < b.dateIso ? -1 : 1;
  });

  const completedRows = completed.map((c) => [
    c.dateIso ? formatShort(c.dateIso, true) : c.dateRaw,
    c.location,
    c.venue,
    c.size,
    c.contactPerson,
    c.contactInfo,
    c.notes,
  ]);

  return (
    <div className="page">
      <Masthead />

      <div className="page-head">
        <div>
          <h2>Screenings</h2>
          <div className="page-caption">
            Upcoming and possible screenings outside the festival circuit, read live from the
            Screenings spreadsheet.
          </div>
        </div>
        <TableModalButton
          label="Completed screenings"
          title="Completed screenings"
          caption="Screenings that have already happened, straight from the Completed tab."
          columns={COMPLETED_COLUMNS}
          rows={completedRows}
          emptyTitle="No completed screenings yet"
          emptyHint="Rows added to the Completed tab of the Screenings spreadsheet will show up in this window."
        />
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <strong>No screenings on the books yet</strong>
          This page reads the <code>Upcoming/ Possible</code> tab of the Screenings spreadsheet.
          Share that spreadsheet with the dashboard&rsquo;s service account and set{" "}
          <code>SCREENINGS_SHEET_ID</code>, and every row will appear here within a few minutes.
        </div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="full-table">
              <thead>
                <tr>
                  <th>Confirmed</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Theater / Organization</th>
                  <th>Size</th>
                  <th>Q&amp;A?</th>
                  <th>Contact Person</th>
                  <th>Contact Info</th>
                  <th>Website</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const href = toHref(s.website);
                  return (
                    <tr key={`${s.venue}-${s.dateIso || s.dateRaw}-${i}`}>
                      <td>
                        <span
                          className={`status-chip ${s.status ? STATUS_CLASS[s.status] : "neutral"}`}
                        >
                          {s.status ?? (s.statusRaw || "Not set")}
                        </span>
                      </td>
                      <td className="date-cell num">
                        {s.dateIso ? (
                          formatShort(s.dateIso, true)
                        ) : (
                          <span className="date-muted">{s.dateRaw || "TBD"}</span>
                        )}
                      </td>
                      <td className="cell-secondary">{s.location || "-"}</td>
                      <td className="cell-strong">{s.venue || "-"}</td>
                      <td className="cell-secondary">{s.size || "-"}</td>
                      <td className="cell-secondary">{s.qa || "-"}</td>
                      <td className="cell-secondary">{s.contactPerson || "-"}</td>
                      <td className="cell-secondary wrap-cell">{s.contactInfo || "-"}</td>
                      <td className="cell-secondary wrap-cell">
                        {href ? (
                          <a href={href} target="_blank" rel="noopener" className="cell-link">
                            {s.website}
                          </a>
                        ) : (
                          s.website || "-"
                        )}
                      </td>
                      <td className="cell-secondary wrap-cell">{s.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
