"use client";

import { useState } from "react";
import type { TopContactSection } from "@/lib/sheets";
import {
  CONTACT_COLUMNS,
  colClass,
  ContactColGroup,
  ContactDetailModal,
  ContactRowCells,
  fromTopContact,
  rowKeyDown,
  type ContactRecord,
} from "./ContactTableParts";

/**
 * The Top Contacts tab, inside a bar that is collapsed until it is clicked.
 *
 * Columns, widths, row shading and the detail popup all come from
 * ContactTableParts, the same pieces the Media List table uses, so the two
 * sections read identically. Team Member Involved is not one of the eight
 * columns, it appears in the popup instead.
 */
export default function TopContactsSections({ sections }: { sections: TopContactSection[] }) {
  const total = sections.reduce((sum, s) => sum + s.contacts.length, 0);
  const [openRecord, setOpenRecord] = useState<ContactRecord | null>(null);

  return (
    <details className="collapse-panel">
      <summary className="collapse-bar">
        <span className="collapse-label">Top Contacts</span>
        <span className="collapse-note">
          {total === 0
            ? "Nothing on this tab yet"
            : `${total} contact${total === 1 ? "" : "s"} across ${sections.length} section${
                sections.length === 1 ? "" : "s"
              }`}
        </span>
      </summary>

      <div className="collapse-body">
        {sections.length === 0 ? (
          <div className="empty-state">
            <strong>No top contacts to show yet</strong>
            This section reads the <code>Top Contacts</code> tab of the Media Contacts spreadsheet,
            including its own section headings. Once that spreadsheet is shared with the
            dashboard&rsquo;s service account, the contacts will appear here grouped exactly as they
            are grouped on the tab.
          </div>
        ) : (
          <>
            <p className="panel-caption">Click any row to see the full record.</p>
            {sections.map((section) => (
              <div className="region-group" key={section.title}>
                <div className="region-heading">
                  <h3>{section.title}</h3>
                  <span className="n">
                    {section.contacts.length} contact{section.contacts.length === 1 ? "" : "s"}
                  </span>
                </div>
                <table className="contact-table">
                  <ContactColGroup />
                  <thead>
                    <tr>
                      {CONTACT_COLUMNS.map((label) => (
                        <th key={label} className={colClass(label)}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.contacts.map((c, i) => {
                      const record = fromTopContact(c);
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
                          <ContactRowCells record={record} />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}
      </div>

      {openRecord && (
        <ContactDetailModal record={openRecord} onClose={() => setOpenRecord(null)} />
      )}
    </details>
  );
}
