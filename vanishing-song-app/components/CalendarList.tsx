"use client";

import { useMemo, useState } from "react";
import type { CalEntry, CalKind } from "@/lib/calendar";
import { formatShort, monthLabel } from "@/lib/dates";

const CATEGORY_FILTERS: { key: CalKind; label: string }[] = [
  { key: "notify", label: "Festival Notifications" },
  { key: "event", label: "Festival Events" },
  { key: "post", label: "Social Media Posts" },
];

export default function CalendarList({
  entries,
  todayIso,
}: {
  entries: CalEntry[];
  todayIso: string;
}) {
  const [activeCats, setActiveCats] = useState<Set<CalKind>>(
    () => new Set(CATEGORY_FILTERS.map((c) => c.key))
  );

  const allActive = activeCats.size === CATEGORY_FILTERS.length;

  function toggleCategory(key: CalKind) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      if (next.size === 0) {
        // never allow every pill to be off — mirrors the original behavior
        next.add(key);
      }
      return next;
    });
  }

  function selectAll() {
    setActiveCats(new Set(CATEGORY_FILTERS.map((c) => c.key)));
  }

  // Group filtered entries by (year, month), inserting a "Today" divider
  // at the point in the chronological list where dates cross todayIso.
  const months = useMemo(() => {
    const visible = entries.filter((e) => activeCats.has(e.kind));

    type Row = { type: "item"; entry: CalEntry } | { type: "today" };
    const withMarker: Row[] = [];
    let inserted = false;
    for (const e of visible) {
      if (!inserted && e.dateIso > todayIso) {
        withMarker.push({ type: "today" });
        inserted = true;
      }
      withMarker.push({ type: "item", entry: e });
    }
    if (!inserted) withMarker.push({ type: "today" });

    const groups: { key: string; label: string; rows: Row[] }[] = [];
    let current: { key: string; label: string; rows: Row[] } | null = null;

    for (const row of withMarker) {
      if (row.type === "today") {
        // The today marker rides along inside whichever month group is
        // being built; if none is open yet, open one seeded by todayIso.
        if (!current) {
          const [y, m] = todayIso.split("-").map(Number);
          current = { key: `${y}-${m}`, label: monthLabel(y, m - 1), rows: [] };
          groups.push(current);
        }
        current.rows.push(row);
        continue;
      }
      const [y, m] = row.entry.dateIso.split("-").map(Number);
      const key = `${y}-${m}`;
      if (!current || current.key !== key) {
        current = { key, label: monthLabel(y, m - 1), rows: [] };
        groups.push(current);
      }
      current.rows.push(row);
    }

    return groups;
  }, [entries, activeCats, todayIso]);

  const hasPostEntries = entries.some((e) => e.kind === "post");
  const showPostEmpty = activeCats.has("post") && !hasPostEntries;

  return (
    <>
      <div className="filter-row" role="group" aria-label="Filter by category">
        <button className={`filter-pill${allActive ? " is-active" : ""}`} onClick={selectAll}>
          All
        </button>
        {CATEGORY_FILTERS.map((c) => (
          <button
            key={c.key}
            className={`filter-pill${activeCats.has(c.key) ? " is-active" : ""}`}
            onClick={() => toggleCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="cal-legend">
        <span>
          <i className="i-notify"></i> Festival notification
        </span>
        <span>
          <i className="i-event"></i> Festival event
        </span>
        <span>
          <i className="i-post"></i> Social media post
        </span>
      </div>

      {showPostEmpty && (
        <div className="empty-state" style={{ marginBottom: 26 }}>
          <strong>No social posts scheduled yet</strong>
          Add rows to the Social Media Campaign sheet and they&rsquo;ll appear on the calendar by date.
        </div>
      )}

      <div>
        {months.map((month) => (
          <div className="cal-month" key={month.key}>
            <h3>{month.label}</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {month.rows.map((row, i) =>
                row.type === "today" ? (
                  <div className="cal-today" key={`today-${i}`}>
                    Today — {formatShort(todayIso, true)}
                  </div>
                ) : (
                  <CalItem key={`${row.entry.kind}-${row.entry.title}-${row.entry.dateIso}-${i}`} entry={row.entry} isPast={row.entry.dateIso < todayIso} />
                )
              )}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function CalItem({ entry, isPast }: { entry: CalEntry; isPast: boolean }) {
  const dotCls = entry.kind === "notify" ? "notify" : entry.kind === "event" ? "event" : "post";
  const typeLabel = entry.kind === "notify" ? "Notification expected" : entry.meta;
  return (
    <li className={`cal-item${isPast ? " is-past" : ""}`}>
      <div className="cal-date num">{formatShort(entry.dateIso)}</div>
      <span className={`cal-dot ${dotCls}`}></span>
      <div className="cal-body">
        <div className="cal-title">{entry.title}</div>
        <div className="cal-meta">{typeLabel}</div>
      </div>
      <div className="cal-status">
        <span className={`status-chip ${entry.statusClass}`}>{entry.statusLabel}</span>
      </div>
    </li>
  );
}
