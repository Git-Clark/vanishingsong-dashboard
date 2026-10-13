"use client";

import { useMemo, useState } from "react";
import type { Festival } from "@/lib/sampleData";
import { formatShort } from "@/lib/dates";

const STATUS_CLASS: Record<string, string> = {
  Pending: "pending",
  "Not accepted": "critical",
  Accepted: "good",
  Withdrawn: "neutral",
};

/** Anything typed into the sheet that we do not style explicitly reads neutral. */
export function statusClass(status: string): string {
  return STATUS_CLASS[status] ?? "neutral";
}

/** Pill order. Any other status the sheet contains is appended after these. */
const PILL_ORDER = ["Pending", "Accepted", "Not accepted", "Withdrawn"];

export default function FestivalsTable({ festivals }: { festivals: Festival[] }) {
  const [filter, setFilter] = useState<string>("all");

  const sorted = useMemo(
    () =>
      [...festivals].sort((a, b) => {
        if (a.notifyIso === null && b.notifyIso === null) return 0;
        if (a.notifyIso === null) return 1;
        if (b.notifyIso === null) return -1;
        return a.notifyIso < b.notifyIso ? -1 : 1;
      }),
    [festivals]
  );

  // Counted from whatever the sheet actually contains, so a status Clark adds
  // later shows up on its own rather than vanishing into Pending.
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of sorted) c[f.status] = (c[f.status] ?? 0) + 1;
    return c;
  }, [sorted]);

  const pills = useMemo(() => {
    const present = Object.keys(counts);
    const known = PILL_ORDER.filter((s) => present.includes(s));
    const extra = present.filter((s) => !PILL_ORDER.includes(s)).sort();
    return [...known, ...extra];
  }, [counts]);

  const visible = filter === "all" ? sorted : sorted.filter((f) => f.status === filter);

  return (
    <>
      <div className="filter-row" role="group" aria-label="Filter by status">
        <button
          className={`filter-pill${filter === "all" ? " is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All <span className="n">{sorted.length}</span>
        </button>
        {pills.map((status) => (
          <button
            key={status}
            className={`filter-pill${filter === status ? " is-active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status} <span className="n">{counts[status]}</span>
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="full-table">
            <thead>
              <tr>
                <th>Festival</th>
                <th>Location</th>
                <th>Notifies</th>
                <th>Event Date</th>
                <th>Status</th>
                <th>Oscar Qualifying</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((f) => (
                <tr key={f.name}>
                  <td>
                    <div className="fest-name">{f.name}</div>
                  </td>
                  <td className="cell-secondary">{f.location}</td>
                  <td className="date-cell">
                    {f.notifyIso ? (
                      <span className="num">{formatShort(f.notifyIso)}</span>
                    ) : (
                      <span className="date-muted">TBD</span>
                    )}
                  </td>
                  <td className="date-cell num">{formatShort(f.eventIso)}</td>
                  <td>
                    <span className={`status-chip ${statusClass(f.status)}`}>{f.status}</span>
                  </td>
                  <td>
                    <span className="status-chip neutral">Unconfirmed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
