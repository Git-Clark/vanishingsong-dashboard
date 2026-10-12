"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A button that opens a modal holding one plain table.
 *
 * Shared by the Contacted list on Media Contacts and the Completed list on
 * Screenings, so both behave identically: the modal closes on the X, on a
 * click on the backdrop outside the box, and on the Escape key, and focus
 * returns to the button that opened it.
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Put the keyboard back where it was before the modal opened.
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const titleId = `modal-title-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="filter-pill"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {label}
      </button>

      {open && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="modal-head">
              <div>
                <div className="panel-title" id={titleId}>
                  {title}
                </div>
                {caption && <div className="panel-caption modal-caption">{caption}</div>}
              </div>
              <button
                type="button"
                ref={closeRef}
                className="modal-close"
                onClick={close}
                aria-label={`Close ${title}`}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="modal-body">
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
