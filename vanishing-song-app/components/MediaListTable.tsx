"use client";

import { useMemo, useState } from "react";
import type { MediaListContact } from "@/lib/sheets";

const PAGE_SIZE = 25;

type ColumnKey =
  | "categories"
  | "name"
  | "role"
  | "organization"
  | "email"
  | "socialOrContactPage"
  | "region"
  | "contentType"
  | "recentWork"
  | "notes";

type SortKey = "name" | "email";

/**
 * Column order follows the Media List tab, with the three Category columns
 * collapsed into the first cell. Name and Email sort alphabetically, every
 * other column filters to one of the values present in the sheet.
 */
const COLUMNS: { key: ColumnKey; label: string; mode: "filter" | "sort" }[] = [
  { key: "categories", label: "Category", mode: "filter" },
  { key: "name", label: "Name", mode: "sort" },
  { key: "role", label: "Role", mode: "filter" },
  { key: "organization", label: "Organization / Publication", mode: "filter" },
  { key: "email", label: "Email", mode: "sort" },
  { key: "socialOrContactPage", label: "Social or Contact Page", mode: "filter" },
  { key: "region", label: "Region", mode: "filter" },
  { key: "contentType", label: "Content Type", mode: "filter" },
  { key: "recentWork", label: "Recent Relevant Work", mode: "filter" },
  { key: "notes", label: "Notes", mode: "filter" },
];

/** Every value a row holds for one column. Category has up to three. */
function valuesFor(contact: MediaListContact, key: ColumnKey): string[] {
  if (key === "categories") return contact.categories;
  return [contact[key]];
}

/** Everything the search box looks at, one row flattened into one string. */
function searchHaystack(contact: MediaListContact): string {
  return [
    ...contact.categories,
    contact.name,
    contact.role,
    contact.organization,
    contact.email,
    contact.socialOrContactPage,
    contact.region,
    contact.contentType,
    contact.recentWork,
    contact.notes,
    contact.sourceUrl,
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Loose name key for matching a Media List row against the Top Contacts tab.
 * Accents, punctuation, spacing and case are all ignored, so
 * "Renee Tajima-Pena" and "Renée Tajima-Peña" come out the same.
 */
function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function shorten(value: string, max = 48): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default function MediaListTable({
  contacts,
  topContactNames,
}: {
  contacts: MediaListContact[];
  /** Names from the Top Contacts tab, used only to decide who gets a star. */
  topContactNames: string[];
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Partial<Record<ColumnKey, string>>>({});
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const starred = useMemo(() => {
    const keys = new Set<string>();
    for (const name of topContactNames) {
      const key = nameKey(name);
      if (key) keys.add(key);
    }
    return keys;
  }, [topContactNames]);

  // Distinct values come from the whole sheet, not from the current view, so
  // the dropdowns stay stable while filters are applied.
  const options = useMemo(() => {
    const map = new Map<ColumnKey, string[]>();
    for (const col of COLUMNS) {
      if (col.mode !== "filter") continue;
      const seen = new Set<string>();
      for (const c of contacts) {
        for (const v of valuesFor(c, col.key)) {
          if (v) seen.add(v);
        }
      }
      map.set(
        col.key,
        Array.from(seen).sort((a, b) => a.localeCompare(b))
      );
    }
    return map;
  }, [contacts]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const active = Object.entries(filters).filter(([, v]) => v) as [ColumnKey, string][];

    // Search and every active column filter have to match, all at once.
    let rows = contacts.filter((c) => {
      if (needle && !searchHaystack(c).includes(needle)) return false;
      for (const [key, value] of active) {
        if (!valuesFor(c, key).includes(value)) return false;
      }
      return true;
    });

    if (sort) {
      rows = [...rows].sort((a, b) => {
        const cmp = a[sort.key].localeCompare(b[sort.key], undefined, { sensitivity: "base" });
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [contacts, query, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const filtersActive = Boolean(query.trim()) || Object.values(filters).some(Boolean) || Boolean(sort);

  function setFilter(key: ColumnKey, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev && prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
    setPage(1);
  }

  function clearAll() {
    setQuery("");
    setFilters({});
    setSort(null);
    setPage(1);
  }

  if (contacts.length === 0) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Media List</h3>
        </div>
        <p className="panel-caption">The full press directory.</p>
        <div className="empty-state">
          <strong>No contacts to show yet</strong>
          This table reads the <code>Media List</code> tab of the Media Contacts spreadsheet. Share
          that spreadsheet with the dashboard&rsquo;s service account and set{" "}
          <code>CONTACTS_SHEET_ID</code>, and every row will appear here within a few minutes.
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head section-head">
        <h3 className="panel-title">Media List</h3>
        <div className="section-tools">
          {filtersActive && (
            <button type="button" className="filter-pill" onClick={clearAll}>
              Clear filters
            </button>
          )}
          <label className="search-label">
            <span className="sr-only">Search the media list</span>
            <input
              type="search"
              className="search-input"
              placeholder="Search every column"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
      </div>
      <p className="panel-caption">
        {visible.length} of {contacts.length} contact{contacts.length === 1 ? "" : "s"} shown. A star
        marks a contact who is also on the Top Contacts tab.
      </p>

      <div className="table-scroll">
        <table className="full-table sticky-head">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key}>
                  {col.mode === "sort" ? (
                    <button
                      type="button"
                      className="col-sort"
                      onClick={() => toggleSort(col.key as SortKey)}
                      aria-label={`Sort by ${col.label}`}
                    >
                      {col.label}
                      <span aria-hidden="true" className="col-arrow">
                        {sort?.key === col.key ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  ) : (
                    <div className="col-filter-wrap">
                      <span>{col.label}</span>
                      <select
                        className="col-filter"
                        value={filters[col.key] ?? ""}
                        onChange={(e) => setFilter(col.key, e.target.value)}
                        aria-label={`Filter by ${col.label}`}
                      >
                        <option value="">All</option>
                        {(options.get(col.key) ?? []).map((v) => (
                          <option key={v} value={v}>
                            {shorten(v)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c, i) => (
              <tr key={`${c.email || c.name}-${i}`}>
                <td>
                  <div className="cat-stack">
                    {c.categories.length === 0 && <span className="cat-line">-</span>}
                    {c.categories.map((cat) => (
                      <span className="cat-line" key={cat}>
                        {cat}
                      </span>
                    ))}
                    {starred.has(nameKey(c.name)) && (
                      <span
                        className="top-star"
                        title="Also on the Top Contacts tab, a priority contact"
                      >
                        <span aria-hidden="true">{"★"}</span>
                        <span className="sr-only">Also on the Top Contacts tab</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="cell-strong">{c.name || "-"}</td>
                <td className="cell-secondary">{c.role || "-"}</td>
                <td className="cell-secondary">{c.organization || "-"}</td>
                <td className="cell-secondary wrap-cell">{c.email || "-"}</td>
                <td className="cell-secondary wrap-cell">{c.socialOrContactPage || "-"}</td>
                <td className="cell-secondary">{c.region || "-"}</td>
                <td className="cell-secondary">{c.contentType || "-"}</td>
                <td className="cell-secondary wrap-cell">{c.recentWork || "-"}</td>
                <td className="cell-secondary wrap-cell">{c.notes || "-"}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="cell-secondary">
                  No contacts match the search and filters. Clear them to see the full list again.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button
          type="button"
          className="filter-pill"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <span className="pager-info num">
          Page {currentPage} of {pageCount}
        </span>
        <button
          type="button"
          className="filter-pill"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= pageCount}
        >
          Next
        </button>
      </div>
    </div>
  );
}
