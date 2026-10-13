"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";

/**
 * A button that opens a modal holding one plain table.
 *
 * Shared by the Contacted list on Media Contacts and the Completed list on
 * Screenings. The modal itself, including closing on the X, on the backdrop
 * and on Escape and returning focus to this button, comes from ModalShell.
 *
 * Rows are passed in already stringified, in the same column order as the
 * sheet, so nothing is remapped on the way through.
 */
export default function TableModalButton({
  label,
  title,
  caption,
  columns,
  rows,
  emptyTitle,
  emptyHint,
}: {
  label: string;
  title: string;
  caption?: string;
  columns: string[];
  rows: string[][];
  emptyTitle: string;
  emptyHint: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="filter-pill"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {label}
      </button>

      {open && (
        <ModalShell title={title} caption={caption} onClose={() => setOpen(false)}>
          {rows.length === 0 ? (
            <div className="empty-state">
              <strong>{emptyTitle}</strong>
              {emptyHint}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="full-table">
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((value, j) => (
                        <td key={j} className={j === 0 ? "cell-strong" : "cell-secondary"}>
                          {value || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModalShell>
      )}
    </>
  );
}
