"use client";

import ModalShell from "./ModalShell";
import type { MediaListContact, TopContact } from "@/lib/sheets";

/**
 * The pieces both contact tables are built from: the Media List table and the
 * Top Contacts sections. They share one column order, one set of proportional
 * column widths, one row treatment and one detail popup, so the two read the
 * same way down the page.
 *
 * The eight visible columns are deliberately narrow and truncate to a single
 * line. Nothing is lost by that, because clicking or pressing Enter on a row
 * opens the whole record in the popup below.
 */

/** One contact, normalised so both sheets' shapes come out the same. */
export interface ContactRecord {
  categories: string[];
  contentType: string;
  name: string;
  role: string;
  region: string;
  /** "Organization/ Publication" on Media List, "Publication" on Top Contacts. */
  org: string;
  email: string;
  contactPage: string;
  recentWork: string;
  notes: string;
  sourceUrl: string;
  /** Top Contacts only, blank on Media List rows. */
  teamMember: string;
}

export function fromMediaListContact(c: MediaListContact): ContactRecord {
  return {
    categories: c.categories,
    contentType: c.contentType,
    name: c.name,
    role: c.role,
    region: c.region,
    org: c.organization,
    email: c.email,
    contactPage: c.socialOrContactPage,
    recentWork: c.recentWork,
    notes: c.notes,
    sourceUrl: c.sourceUrl,
    teamMember: "",
  };
}

export function fromTopContact(c: TopContact): ContactRecord {
  return {
    categories: c.categories,
    contentType: c.contentType,
    name: c.name,
    role: c.role,
    region: c.region,
    org: c.publication,
    email: c.email,
    contactPage: c.socialOrContactPage,
    recentWork: c.recentWork,
    notes: c.notes,
    // The Top Contacts tab has no Source URL column.
    sourceUrl: "",
    teamMember: c.teamMember,
  };
}

/** The eight columns, in the order the owner asked for, both tables. */
// Email and Recent Work were dropped from the table at the owner's request.
// Both still appear in the detail popup, so nothing is lost, and the six
// remaining columns each get more room.
export const CONTACT_COLUMNS = [
  "Category",
  "Content Type",
  "Name",
  "Role",
  "Region",
  "Org/ Publication",
] as const;

/**
 * Proportional widths, totalling 100 percent, so the content never decides how
 * wide a column is. Paired with table-layout: fixed in globals.css this is what
 * keeps the table inside its panel with no sideways scrolling.
 */
export function ContactColGroup() {
  return (
    <colgroup>
      <col style={{ width: "19%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "17%" }} />
      <col style={{ width: "22%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "18%" }} />
    </colgroup>
  );
}

/** The six cells of one row. Truncation is handled in CSS. */
export function ContactRowCells({ record, star }: { record: ContactRecord; star?: boolean }) {
  const categoryLine = record.categories.filter(Boolean).join(", ");
  return (
    <>
      <td title={categoryLine || undefined}>
        {star && (
          <span className="top-star" title="Also on the Top Contacts tab, a priority contact">
            <span aria-hidden="true">{"★"}</span>
            <span className="sr-only">Also on the Top Contacts tab</span>
          </span>
        )}
        <span className="cell-secondary">{categoryLine || "-"}</span>
      </td>
      <td className="cell-secondary">{record.contentType || "-"}</td>
      <td className="cell-strong">{record.name || "-"}</td>
      <td className="cell-secondary">{record.role || "-"}</td>
      <td className="cell-secondary">{record.region || "-"}</td>
      <td className="cell-secondary">{record.org || "-"}</td>
    </>
  );
}

/**
 * Makes a row behave like the button it is: Enter and Space open the popup,
 * the same as a click. Space is prevented from scrolling the page.
 */
export function rowKeyDown(open: () => void) {
  return (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      open();
    }
  };
}

/**
 * Turns a cell into a link target when it looks like one. The sheet's contact
 * page column sometimes holds a bare domain and sometimes a social handle, and
 * a handle is shown as plain text rather than guessed at.
 */
function asHref(value: string): string | null {
  const v = value.trim();
  if (!v || /\s/.test(v)) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(v)) return `https://${v}`;
  return null;
}

function DetailField({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={`detail-field${wide ? " is-wide" : ""}`}>
      <div className="contact-field-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  );
}

function DetailLink({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  const href = asHref(value);
  return (
    <div className="detail-field is-wide">
      <div className="contact-field-label">{label}</div>
      <div className="detail-value">
        {href ? (
          <a className="cell-link" href={href} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

/**
 * The whole record for one contact, opened by clicking its row.
 *
 * The contact page and the notes sit in their own block at the top, because
 * those are the two the owner reaches for first. Everything else the sheet
 * holds follows underneath.
 */
export function ContactDetailModal({
  record,
  onClose,
}: {
  record: ContactRecord;
  onClose: () => void;
}) {
  const caption = [record.role, record.org].filter(Boolean).join(" · ");
  const hasPrimary = Boolean(record.contactPage || record.notes);

  return (
    <ModalShell
      title={record.name || record.org || record.email || "Contact"}
      caption={caption || undefined}
      onClose={onClose}
    >
      {hasPrimary && (
        <div className="detail-primary">
          <DetailLink label="Social or Contact Page" value={record.contactPage} />
          <DetailField label="Notes" value={record.notes} wide />
        </div>
      )}

      <div className="detail-grid">
        <DetailField label="Category" value={record.categories.filter(Boolean).join(", ")} />
        <DetailField label="Content Type" value={record.contentType} />
        <DetailField label="Role" value={record.role} />
        <DetailField label="Org/ Publication" value={record.org} />
        <DetailField label="Region" value={record.region} />
        <DetailField label="Email" value={record.email} />
        <DetailField label="Team Member Involved" value={record.teamMember} />
        <DetailField label="Recent Relevant Work" value={record.recentWork} wide />
        <DetailLink label="Source URL" value={record.sourceUrl} />
      </div>
    </ModalShell>
  );
}
