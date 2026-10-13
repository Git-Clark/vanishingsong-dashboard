"use client";

import { useEffect, useRef } from "react";

/**
 * The one modal treatment used across the site.
 *
 * Render it only while the modal should be open, so mounting is opening and
 * unmounting is closing. It closes on the X, on a click on the backdrop
 * outside the box, and on the Escape key, and on unmount it puts the keyboard
 * back on whatever element was focused when it opened, which may be a button
 * (the Contacted and Completed lists) or a table row (a contact's details).
 *
 * Shared by components/TableModalButton.tsx and the row click on both contact
 * tables, so there is only one copy of this behaviour.
 */
export default function ModalShell({
  title,
  caption,
  children,
  onClose,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<Element | null>(null);
  // Kept in a ref so the effect below runs exactly once, on open and close,
  // even when the caller passes a fresh function on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    openerRef.current = document.activeElement;
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const opener = openerRef.current;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  const titleId = `modal-title-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
