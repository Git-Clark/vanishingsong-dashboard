// Server-side Google Sheets data layer.
//
// Four spreadsheets are read through one service-account JWT client:
//
//   FESTIVALS_SHEET_ID   festival submissions, one tab
//   SOCIAL_SHEET_ID      social campaign, tabs "Upcoming" and "Completed"
//   CONTACTS_SHEET_ID    tabs "Media List", "Top Contacts" and "Contacted"
//   SCREENINGS_SHEET_ID  tabs "Upcoming/ Possible" and "Completed"
//
// NOTE ON FIRST RUN: the two newer spreadsheets, Contacts and Screenings, may
// not be shared with the service account yet, and several tabs are still empty
// in the ones that are. Empty is therefore the expected first-run state, not a
// fault. Every getter below returns an empty array in that case and each page
// renders a calm empty state.
//
// GRACEFUL DEGRADATION CONTRACT, please keep this intact:
//   a missing env var, a sheet that has not been shared, a renamed tab or any
//   failed API call must come back as an empty result. Nothing here throws, so
//   the owner never sees a stack trace. Errors go to the server log only.
//
// Nothing is cached in this module. Each call reads the sheet fresh, the same
// uncached behaviour as before, and the pages control how often that happens
// with their own `export const revalidate`.
//
// Expected layouts, row 1 is a header row everywhere, so reads start at row 2
// (the one exception, "Top Contacts", is described at its getter):
//
// FESTIVALS_SHEET_ID, tab "Festivals":
//   Name | Notify Date | Event Date | Location | Status
//
// SOCIAL_SHEET_ID, tab "Upcoming" (A:F):
//   Social | Post Date (HK) | Status | Topic/ Type | Copy | Visual
// SOCIAL_SHEET_ID, tab "Completed" (A:J):
//   ...the same six, then Post Link | Views | Hearts | Comments
//
// CONTACTS_SHEET_ID, tab "Media List" (A:M):
//   Category | Category | Category | Name | Role | Organization/ Publication |
//   Email | Social or Contact Page | Region | Content Type |
//   Recent Relevant Work | Notes | Source URL
// CONTACTS_SHEET_ID, tab "Top Contacts" (A:M):
//   Region | Team Member Involved | Category | Category | Category |
//   Publication | Name | Role | Email | Social or Contact Page |
//   Content Type | Recent Relevant Work | Notes
// CONTACTS_SHEET_ID, tab "Contacted" (A:G):
//   Region | Publication | Content Type | Name | Email | Recent Articles |
//   Notes/ Other Involvements
//
// SCREENINGS_SHEET_ID, tab "Upcoming/ Possible" (A:J):
//   Confirmed | Date | Location | Theater/ Organization | Size | Q&A? |
//   Contact Person | Contact Info | Website | Notes
// SCREENINGS_SHEET_ID, tab "Completed" (A:G):
//   Date | Location | Theater/ Organization | Size | Contact Person |
//   Contact Info | Notes

import { google } from "googleapis";
import {
  SAMPLE_FESTIVALS,
  SAMPLE_MEDIA_LIST,
  SAMPLE_TOP_CONTACTS,
  SAMPLE_CONTACTED,
  SAMPLE_SOCIAL_POSTS,
  SAMPLE_UPCOMING_SCREENINGS,
  SAMPLE_COMPLETED_SCREENINGS,
  type Festival,
  type FestivalStatus,
  type MediaListContact,
  type TopContact,
  type TopContactSection,
  type ContactedEntry,
  type SocialChannel,
  type SocialPost,
  type SocialSection,
  type ScreeningStatus,
  type UpcomingScreening,
  type CompletedScreening,
} from "./sampleData";

// Re-exported so pages and components can take both the data and its types
// from one place.
export type {
  Festival,
  FestivalStatus,
  MediaListContact,
  TopContact,
  TopContactSection,
  ContactedEntry,
  SocialChannel,
  SocialPost,
  SocialSection,
  ScreeningStatus,
  UpcomingScreening,
  CompletedScreening,
};

function credentialsConfigured(...ids: (string | undefined)[]) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  return Boolean(email && key && ids.every(Boolean));
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Private keys stored in env vars typically have their newlines escaped.
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

async function fetchRows(sheetId: string, range: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return (res.data.values as string[][] | undefined) ?? [];
}

/**
 * Reads one range and never throws. An unconfigured env var, an unshared
 * spreadsheet, a renamed tab or a network failure all come back as [].
 */
async function safeRows(
  label: string,
  sheetId: string | undefined,
  range: string
): Promise<string[][]> {
  if (!credentialsConfigured(sheetId)) return [];
  try {
    return await fetchRows(sheetId as string, range);
  } catch (err) {
    console.error(`${label}: could not read ${range}, showing an empty state.`, err);
    return [];
  }
}

/** Trimmed value of one cell, "" when the row is short or the cell is blank. */
function cell(row: string[] | undefined, i: number): string {
  return (row?.[i] ?? "").toString().trim();
}

/** True when every cell in the row is blank. */
function isBlankRow(row: string[]): boolean {
  return row.every((c) => !(c ?? "").toString().trim());
}

/** Collapses the sheet's repeated Category columns into one list of values. */
function categories(row: string[], ...indexes: number[]): string[] {
  return indexes.map((i) => cell(row, i)).filter(Boolean);
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Best effort date reader. Returns an ISO (YYYY-MM-DD) string, or "" when the
 * cell is blank or written in a form we cannot read confidently. Callers show
 * the raw text in that case, so nothing is ever lost or mis-stated.
 *
 * Understood forms: 2026-10-09, 10/09/2026 and 10/9/26 (month first, the
 * Google Sheets US default), and "Oct 9, 2026".
 */
function toIsoDate(raw: string): string {
  const value = raw.trim();
  if (!value) return "";

  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${pad(Number(m))}-${pad(Number(d))}`;
  }

  const slash = value.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2}|\d{4})$/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    let year = Number(slash[3]);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad(month)}-${pad(day)}`;
    }
    return "";
  }

  const words = value.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?$/);
  if (words) {
    const month = MONTHS[words[1].toLowerCase()];
    const day = Number(words[2]);
    const year = words[3] ? Number(words[3]) : new Date().getUTCFullYear();
    if (month && day >= 1 && day <= 31) {
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  return "";
}

/* ============ FESTIVALS ============ */

const VALID_STATUS: FestivalStatus[] = ["Pending", "Not accepted", "Accepted"];

export async function getFestivals(): Promise<Festival[]> {
  const sheetId = process.env.FESTIVALS_SHEET_ID;
  if (!credentialsConfigured(sheetId)) {
    return SAMPLE_FESTIVALS;
  }
  try {
    const rows = await fetchRows(sheetId as string, "Festivals!A2:E");
    if (!rows.length) return SAMPLE_FESTIVALS;
    return rows
      .filter((r) => r[0])
      .map((r) => {
        const [name, notify, event, location, status] = r;
        const cleanStatus = VALID_STATUS.includes(status as FestivalStatus)
          ? (status as FestivalStatus)
          : "Pending";
        return {
          name: name?.trim() ?? "",
          notifyIso: notify?.trim() || null,
          eventIso: event?.trim() ?? "",
          location: location?.trim() ?? "",
          status: cleanStatus,
        };
      });
  } catch (err) {
    console.error("getFestivals: falling back to the bundled festival list.", err);
    return SAMPLE_FESTIVALS;
  }
}

/* ============ SOCIAL ============ */

// The sheet's first column is "Social" and holds a platform name typed by
// hand, so it is matched loosely: case is ignored, spaces and punctuation are
// stripped, and the common short forms are listed as aliases. A value that
// matches nothing is still kept on the post, it simply does not belong to one
// of the six channel tabs.
const CHANNEL_ALIASES: Record<string, SocialChannel> = {
  instagram: "instagram",
  ig: "instagram",
  insta: "instagram",
  instagramreels: "instagram",
  facebook: "facebook",
  fb: "facebook",
  facebookpage: "facebook",
  linkedin: "linkedin",
  li: "linkedin",
  website: "website",
  web: "website",
  site: "website",
  blog: "website",
  ourwebsite: "website",
  rednote: "rednote",
  red: "rednote",
  xiaohongshu: "rednote",
  xhs: "rednote",
  littleredbook: "rednote",
  "小红书": "rednote",
  wechat: "wechat",
  weixin: "wechat",
  "微信": "wechat",
};

function matchChannel(raw: string): SocialChannel | null {
  const key = raw.toLowerCase().replace(/[^a-z0-9一-鿿]/g, "");
  return CHANNEL_ALIASES[key] ?? null;
}

function toSocialPost(row: string[], section: SocialSection): SocialPost {
  const channelName = cell(row, 0);
  const postDateRaw = cell(row, 1);
  return {
    section,
    channel: matchChannel(channelName),
    channelName,
    postDateIso: toIsoDate(postDateRaw),
    postDateRaw,
    status: cell(row, 2),
    topic: cell(row, 3),
    copy: cell(row, 4),
    visual: cell(row, 5),
    postLink: cell(row, 6),
    views: cell(row, 7),
    hearts: cell(row, 8),
    comments: cell(row, 9),
  };
}

/** Posts from the Social spreadsheet's "Upcoming" tab. */
export async function getSocialUpcoming(): Promise<SocialPost[]> {
  const rows = await safeRows("getSocialUpcoming", process.env.SOCIAL_SHEET_ID, "Upcoming!A2:F");
  return rows.filter((r) => !isBlankRow(r)).map((r) => toSocialPost(r, "upcoming"));
}

/** Posts from the Social spreadsheet's "Completed" tab, with their metrics. */
export async function getSocialCompleted(): Promise<SocialPost[]> {
  const rows = await safeRows("getSocialCompleted", process.env.SOCIAL_SHEET_ID, "Completed!A2:J");
  return rows.filter((r) => !isBlankRow(r)).map((r) => toSocialPost(r, "completed"));
}

/** Both social tabs together, upcoming first. */
export async function getSocialPosts(): Promise<SocialPost[]> {
  const [upcoming, completed] = await Promise.all([getSocialUpcoming(), getSocialCompleted()]);
  if (!upcoming.length && !completed.length) return SAMPLE_SOCIAL_POSTS;
  return [...upcoming, ...completed];
}

/* ============ MEDIA CONTACTS ============ */

/** The full "Media List" directory. Columns A to M, three of them Category. */
export async function getMediaList(): Promise<MediaListContact[]> {
  const rows = await safeRows("getMediaList", process.env.CONTACTS_SHEET_ID, "'Media List'!A2:M");
  if (!rows.length) return SAMPLE_MEDIA_LIST;
  return rows
    .filter((r) => !isBlankRow(r))
    .map((r) => ({
      categories: categories(r, 0, 1, 2),
      name: cell(r, 3),
      role: cell(r, 4),
      organization: cell(r, 5),
      email: cell(r, 6),
      socialOrContactPage: cell(r, 7),
      region: cell(r, 8),
      contentType: cell(r, 9),
      recentWork: cell(r, 10),
      notes: cell(r, 11),
      sourceUrl: cell(r, 12),
    }))
    .filter((c) => c.name || c.organization || c.email);
}

/**
 * The "Top Contacts" tab, grouped under its own section headings.
 *
 * This tab is read from row 1 because it is not a plain table. It opens with a
 * merged banner title, then a section label, then the real header row, then
 * data. Rather than trusting those positions, the parse looks for the row
 * whose first cell is exactly "Region" and treats that as the header, so the
 * owner can insert a row above it without breaking the page.
 *
 * A row with something in its first cell and nothing in any other cell is a
 * section heading, for example "Print/Online Media Contacts". Headings are
 * read from the sheet rather than listed here, so new ones work on their own.
 * Each contact belongs to the nearest heading above it.
 */
export async function getTopContacts(): Promise<TopContactSection[]> {
  const rows = await safeRows("getTopContacts", process.env.CONTACTS_SHEET_ID, "'Top Contacts'!A1:M");
  if (!rows.length) return SAMPLE_TOP_CONTACTS;

  const headerIndex = rows.findIndex((r) => cell(r, 0).toLowerCase() === "region");
  if (headerIndex === -1) {
    console.error(
      "getTopContacts: no header row starting with \"Region\" was found, showing an empty state."
    );
    return [];
  }

  const sections: TopContactSection[] = [];
  let current: TopContactSection | null = null;
  let pendingTitle = "";

  rows.forEach((row, index) => {
    if (index === headerIndex) return;

    const first = cell(row, 0);
    const hasOther = row.slice(1).some((c) => (c ?? "").toString().trim());

    // Section heading, which is also how the banner title on row 1 and the
    // section label above the header row both look.
    if (first && !hasOther) {
      pendingTitle = first;
      current = null;
      return;
    }

    if (index < headerIndex) return; // anything else above the header is layout
    if (!first && !hasOther) return; // blank spacer row

    const contact: TopContact = {
      region: first,
      teamMember: cell(row, 1),
      categories: categories(row, 2, 3, 4),
      publication: cell(row, 5),
      name: cell(row, 6),
      role: cell(row, 7),
      email: cell(row, 8),
      socialOrContactPage: cell(row, 9),
      contentType: cell(row, 10),
      recentWork: cell(row, 11),
      notes: cell(row, 12),
    };
    if (!contact.name && !contact.publication && !contact.email) return;

    if (!current) {
      current = { title: pendingTitle || "Top Contacts", contacts: [] };
      sections.push(current);
    }
    current.contacts.push(contact);
  });

  return sections.filter((s) => s.contacts.length);
}

/** The "Contacted" outreach log. Currently just headers in the spreadsheet. */
export async function getContacted(): Promise<ContactedEntry[]> {
  const rows = await safeRows("getContacted", process.env.CONTACTS_SHEET_ID, "Contacted!A2:G");
  if (!rows.length) return SAMPLE_CONTACTED;
  return rows
    .filter((r) => !isBlankRow(r))
    .map((r) => ({
      region: cell(r, 0),
      publication: cell(r, 1),
      contentType: cell(r, 2),
      name: cell(r, 3),
      email: cell(r, 4),
      recentArticles: cell(r, 5),
      notes: cell(r, 6),
    }));
}

/* ============ SCREENINGS ============ */

const SCREENING_STATUSES: ScreeningStatus[] = ["Confirmed", "Pending", "Not Contacted"];

/** Matches the three allowed values ignoring case and spacing. */
function matchScreeningStatus(raw: string): ScreeningStatus | null {
  const key = raw.toLowerCase().replace(/[^a-z]/g, "");
  return SCREENING_STATUSES.find((s) => s.toLowerCase().replace(/[^a-z]/g, "") === key) ?? null;
}

/**
 * The "Upcoming/ Possible" tab. The tab name contains a space, so the range
 * has to be quoted.
 */
export async function getUpcomingScreenings(): Promise<UpcomingScreening[]> {
  const rows = await safeRows(
    "getUpcomingScreenings",
    process.env.SCREENINGS_SHEET_ID,
    "'Upcoming/ Possible'!A2:J"
  );
  if (!rows.length) return SAMPLE_UPCOMING_SCREENINGS;
  return rows
    .filter((r) => !isBlankRow(r))
    .map((r) => {
      const statusRaw = cell(r, 0);
      const dateRaw = cell(r, 1);
      return {
        status: matchScreeningStatus(statusRaw),
        statusRaw,
        dateIso: toIsoDate(dateRaw),
        dateRaw,
        location: cell(r, 2),
        venue: cell(r, 3),
        size: cell(r, 4),
        qa: cell(r, 5),
        contactPerson: cell(r, 6),
        contactInfo: cell(r, 7),
        website: cell(r, 8),
        notes: cell(r, 9),
      };
    });
}

/** The screenings "Completed" tab. */
export async function getCompletedScreenings(): Promise<CompletedScreening[]> {
  const rows = await safeRows(
    "getCompletedScreenings",
    process.env.SCREENINGS_SHEET_ID,
    "Completed!A2:G"
  );
  if (!rows.length) return SAMPLE_COMPLETED_SCREENINGS;
  return rows
    .filter((r) => !isBlankRow(r))
    .map((r) => {
      const dateRaw = cell(r, 0);
      return {
        dateIso: toIsoDate(dateRaw),
        dateRaw,
        location: cell(r, 1),
        venue: cell(r, 2),
        size: cell(r, 3),
        contactPerson: cell(r, 4),
        contactInfo: cell(r, 5),
        notes: cell(r, 6),
      };
    });
}
