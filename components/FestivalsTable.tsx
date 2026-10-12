"use client";

import { useMemo, useState } from "react";
import type { Festival, FestivalStatus } from "@/lib/sampleData";
import { formatShort } from "@/lib/dates";

const STATUS_CLASS: Record<FestivalStatus, string> = {
  Pending: "pending",
  "Not accepted": "critical",
  Accepted: "good",
};

type FilterKey = "all" | "pending" | "good" | "critical";

export default function FestivalsTable({ festivals }: { festivals: Festival[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

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

  const counts = useMemo(() => {
    const c: Record<FestivalStatus, number> = { Pending: 0, "Not accepted": 0, Accepted: 0 };
    for (const f of sorted) c[f.status]++;
    return c;
  }, [sorted]);

  const visible = filter === "all" ? sorted : sorted.filter((f) => STATUS_CLASS[f.status] === filter);

  return (
    <>
      <div className="filter-row" role="group" aria-label="Filter by status">
        <button
          className={`filter-pill${filter === "all" ? " is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All <span className="n">{sorted.length}</span>
        </button>
        <button
          className={`filter-pill${filter === "pending" ? " is-active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending <span className="n">{counts.Pending}</span>
        </button>
        <button
          className={`filter-pill${filter === "good" ? " is-active" : ""}`}
          onClick={() => setFilter("good")}
        >
          Accepted <span className="n">{counts.Accepted}</span>
        </button>
        <button
          className={`filter-pill${filter === "critical" ? " is-active" : ""}`}
          onClick={() => setFilter("critical")}
        >
          Not Accepted <span className="n">{counts["Not accepted"]}</span>
        </button>
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
                    <span className={`status-chip ${STATUS_CLASS[f.status]}`}>{f.status}</span>
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
