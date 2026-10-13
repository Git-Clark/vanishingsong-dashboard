"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaListContact } from "@/lib/sheets";
import {
  CONTACT_COLUMNS,
  ContactColGroup,
  ContactDetailModal,
  ContactRowCells,
  colClass,
  fromMediaListContact,
  rowKeyDown,
  type ContactRecord,
} from "./ContactTableParts";

const PAGE_SIZE = 25;

type ColumnKey =
  | "categories"
  | "contentType"
  | "name"
  | "role"
  | "region"
  | "organization"
  | "email"
  | "recentWork";

type SortKey = "name" | "email";

/**
 * The six columns, in the order and with the headings shared with the Top
 * Contacts table. Name sorts alphabetically, every other column filters to one
 * of the values present in the sheet. Labels come from ContactTableParts so the
 * two tables cannot drift apart.
 *
 * Email and Recent Work are no longer columns, but the search box still looks
 * at both, and both appear in the detail popup.
 */
// The index of each label has to match CONTACT_COLUMNS exactly, or a heading
// ends up over the wrong column. Order there: Name, Role, Org/ Publication,
// Region, Content Type, Category.
const COLUMNS: { key: ColumnKey; label: string; mode: "filter" | "sort" }[] = [
  { key: "name", label: CONTACT_COLUMNS[0], mode: "sort" },
  { key: "role", label: CONTACT_COLUMNS[1], mode: "filter" },
  { key: "organization", label: CONTACT_COLUMNS[2], mode: "filter" },
  { key: "region", label: CONTACT_COLUMNS[3], mode: "filter" },
  { key: "contentType", label: CONTACT_COLUMNS[4], mode: "filter" },
  { key: "categories", label: CONTACT_COLUMNS[5], mode: "filter" },
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

/** Where an open filter menu sits on screen, in viewport coordinates. */
type MenuState = { key: ColumnKey; label: string; left: number; top: number };

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
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [openRecord, setOpenRecord] = useState<ContactRecord | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // The filter menu is positioned in viewport coordinates so it is never
  // clipped by the table's own scrolling box. Those coordinates go stale when
  // something scrolls, so the menu follows its caret rather than closing. It
  // used to close on any scroll, which made a long list impossible to scroll
  // through: the first wheel turn dismissed it.
  useEffect(() => {
    if (!menu) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      // The caret handles its own toggle, so leave its clicks alone.
      if (target.closest(".col-caret")) return;
      setMenu(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    function reposition(e: Event) {
      // Scrolling inside the menu itself must not move or close it.
      const target = e.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;

      const caret = document.querySelector<HTMLElement>(
        `.col-caret[data-col="${menu!.key}"]`
      );
      if (!caret) return;
      const rect = caret.getBoundingClientRect();
      // Once the caret has scrolled out of the viewport there is nothing left
      // to anchor to, so close rather than leave the menu floating.
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setMenu(null);
        return;
      }
      setMenu((m) => (m ? { ...m, left: rect.left, top: rect.bottom + 4 } : m));
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // menu.key is what the effect actually depends on; re-running on every
    // x/y change would tear the listeners down mid-scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.key]);

  const starred = useMemo(() => {
    const keys = new Set<string>();
    for (const name of topContactNames) {
      const key = nameKey(name);
      if (key) keys.add(key);
    }
    return keys;
  }, [topContactNames]);

  // Distinct values come from the whole sheet, not from the current view, so
  // the menus stay stable while filters are applied.
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
    setMenu(null);
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
    setMenu(null);
  }

  function toggleMenu(e: React.MouseEvent<HTMLButtonElement>, key: ColumnKey, label: string) {
    // A header control must never be mistaken for a click on a row.
    e.stopPropagation();
    if (menu?.key === key) {
      setMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const MENU_WIDTH = 260;
    setMenu({
      key,
      label,
      left: Math.min(rect.left, Math.max(8, window.innerWidth - MENU_WIDTH - 8)),
      top: rect.bottom + 6,
    });
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
        <div className="panel-title-row">
          <h3 className="panel-title">Media List</h3>
          {/* What the star in the Category column means, said once, here,
              rather than left to the hover tooltip on each row. */}
          <span className="star-key">
            <span className="star-key-mark" aria-hidden="true">
              {"★"}
            </span>
            Recc. Top Contacts
          </span>
        </div>
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
        {visible.length} of {contacts.length} contact{contacts.length === 1 ? "" : "s"} shown. Click
        any row to see the full record. A star marks a contact who is also on the Top Contacts tab.
      </p>

      <div className="table-scroll contact-scroll">
        <table className="contact-table">
          <ContactColGroup />
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} className={colClass(col.label)}>
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
                    <div className="col-head">
                      <span className="col-head-label" title={col.label}>
                        {col.label}
                      </span>
                      <button
                        type="button"
                        className={`col-caret${filters[col.key] ? " is-active" : ""}`}
                        data-col={col.key}
                        onClick={(e) => toggleMenu(e, col.key, col.label)}
                        aria-haspopup="menu"
                        aria-expanded={menu?.key === col.key}
                        aria-label={
                          filters[col.key]
                            ? `Filter by ${col.label}, currently ${filters[col.key]}`
                            : `Filter by ${col.label}`
                        }
                      >
                        <span aria-hidden="true">▾</span>
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c, i) => {
              const record = fromMediaListContact(c);
              const open = () => setOpenRecord(record);
              return (
                <tr
                  key={`${c.email || c.name}-${i}`}
                  tabIndex={0}
                  aria-haspopup="dialog"
                  title="Open the full record"
                  onClick={open}
                  onKeyDown={rowKeyDown(open)}
                >
                  <ContactRowCells record={record} star={starred.has(nameKey(c.name))} />
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="cell-secondary no-truncate">
                  No contacts match the search and filters. Clear them to see the full list again.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {menu && (
        <div
          className="col-menu"
          ref={menuRef}
          role="menu"
          aria-label={`Filter by ${menu.label}`}
          style={{ left: menu.left, top: menu.top }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            className={`col-menu-item${filters[menu.key] ? "" : " is-chosen"}`}
            onClick={() => setFilter(menu.key, "")}
          >
            All
          </button>
          {(options.get(menu.key) ?? []).map((v) => (
            <button
              key={v}
              type="button"
              role="menuitem"
              className={`col-menu-item${filters[menu.key] === v ? " is-chosen" : ""}`}
              title={v}
              onClick={() => setFilter(menu.key, v)}
            >
              {shorten(v)}
            </button>
          ))}
        </div>
      )}

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

      {openRecord && (
        <ContactDetailModal record={openRecord} onClose={() => setOpenRecord(null)} />
      )}
    </div>
  );
}
