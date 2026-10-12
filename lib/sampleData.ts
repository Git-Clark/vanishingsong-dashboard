// Shared row types for every sheet the dashboard reads, plus the bundled
// sample festival list.
//
// The festival list is used as a fallback whenever the Festivals sheet is not
// configured, so the app always has something to show. Every other dataset
// (social posts, the three contact tabs, screenings) starts out as an empty
// array, because those tabs are either empty in the owner's spreadsheets or
// read live once the sheets are shared with the service account.
//
// Do not edit festival facts here casually, this is real campaign data.

export type FestivalStatus = "Pending" | "Not accepted" | "Accepted";

export interface Festival {
  name: string;
  /** ISO date (YYYY-MM-DD) the festival is expected to notify us, or null if unknown/TBD. */
  notifyIso: string | null;
  /** ISO date (YYYY-MM-DD) of the festival's own event/screening window. */
  eventIso: string;
  location: string;
  status: FestivalStatus;
}

// (name, notify_iso or null, event_iso, location, status)
export const SAMPLE_FESTIVALS: Festival[] = [
  { name: "Telluride Film Festival", notifyIso: "2026-07-23", eventIso: "2026-09-04", location: "Telluride", status: "Not accepted" },
  { name: "Wildlife Conservation Film Festival", notifyIso: "2026-09-07", eventIso: "2026-09-15", location: "Monterrey", status: "Pending" },
  { name: "New York Shorts International Film Festival", notifyIso: "2026-09-12", eventIso: "2026-10-09", location: "New York City", status: "Pending" },
  { name: "42nd Warsaw International Film Festival", notifyIso: "2026-09-18", eventIso: "2026-10-09", location: "Warszawa", status: "Pending" },
  { name: "Hot Springs Documentary Film Festival", notifyIso: "2026-09-30", eventIso: "2026-10-09", location: "Arkansas", status: "Pending" },
  { name: "Santa Fe International Film Festival", notifyIso: "2026-09-09", eventIso: "2026-10-14", location: "New Mexico", status: "Pending" },
  { name: "New Hampshire Film Festival", notifyIso: "2026-09-01", eventIso: "2026-10-15", location: "New Hampshire", status: "Pending" },
  { name: "DOC LA", notifyIso: "2026-09-22", eventIso: "2026-10-21", location: "Los Angeles", status: "Pending" },
  { name: "Women's International Film & Arts Festival (WIFF)", notifyIso: null, eventIso: "2026-10-21", location: "New York City", status: "Pending" },
  { name: "LA Indie Shorts", notifyIso: "2026-10-12", eventIso: "2026-11-01", location: "Los Angeles", status: "Pending" },
  { name: "DOC NYC", notifyIso: "2026-10-14", eventIso: "2026-11-11", location: "New York City", status: "Pending" },
  { name: "International Documentary Film Festival Amsterdam (IDFA)", notifyIso: "2026-09-01", eventIso: "2026-11-12", location: "Amsterdam", status: "Pending" },
  { name: "Cork International Film Festival", notifyIso: "2026-09-18", eventIso: "2026-11-12", location: "Cork", status: "Pending" },
  { name: "London Short Film Festival", notifyIso: "2026-10-22", eventIso: "2027-01-22", location: "London", status: "Pending" },
  { name: "Utah Film Festival", notifyIso: "2026-12-06", eventIso: "2027-01-25", location: "Salt Lake City", status: "Pending" },
  { name: "Santa Barbara International Film Festival", notifyIso: "2027-01-08", eventIso: "2027-02-03", location: "California", status: "Pending" },
  { name: "Big Sky Documentary Film Festival", notifyIso: "2027-01-12", eventIso: "2027-02-12", location: "Missoula", status: "Pending" },
  { name: "Wild & Scenic Film Festival", notifyIso: "2026-12-11", eventIso: "2027-02-16", location: "California", status: "Pending" },
  { name: "Slamdance Film Festival", notifyIso: "2026-12-17", eventIso: "2027-02-18", location: "Los Angeles", status: "Pending" },
  { name: "Cinequest Film Festival", notifyIso: "2027-01-29", eventIso: "2027-03-09", location: "San Jose", status: "Pending" },
  { name: "CPH:DOX", notifyIso: "2027-02-15", eventIso: "2027-03-10", location: "Copenhagen", status: "Pending" },
  { name: "Manchester Film Festival", notifyIso: "2027-01-20", eventIso: "2027-03-11", location: "Manchester", status: "Pending" },
  { name: "American Conservation Film Festival", notifyIso: "2027-01-31", eventIso: "2027-03-12", location: "West Virginia", status: "Pending" },
  { name: "South by Southwest (SXSW)", notifyIso: "2027-02-09", eventIso: "2027-03-15", location: "Austin", status: "Pending" },
  { name: "Full Frame Documentary Film Festival", notifyIso: "2027-03-01", eventIso: "2027-04-01", location: "Durham", status: "Pending" },
  { name: "Athens International Film and Video Festival", notifyIso: "2027-03-05", eventIso: "2027-04-05", location: "Ohio", status: "Pending" },
  { name: "Aspen Shortsfest", notifyIso: "2027-03-03", eventIso: "2027-04-06", location: "Aspen", status: "Pending" },
  { name: "REEL WILD New York Film Festival", notifyIso: "2027-01-31", eventIso: "2027-04-07", location: "New York City", status: "Pending" },
  { name: "Environmental Film Festival in the Nation's Capital", notifyIso: "2027-02-15", eventIso: "2027-04-08", location: "Washington D.C.", status: "Pending" },
  { name: "Sebastopol Documentary Film Festival", notifyIso: "2026-12-15", eventIso: "2027-04-15", location: "California", status: "Pending" },
  { name: "RiverRun International Film Festival", notifyIso: "2027-02-15", eventIso: "2027-04-16", location: "North Carolina", status: "Pending" },
  { name: "Abbeville Bird and Nature Festival", notifyIso: "2027-01-15", eventIso: "2027-04-17", location: "France", status: "Pending" },
  { name: "San Luis Obispo International Film Festival", notifyIso: "2027-02-01", eventIso: "2027-04-22", location: "California", status: "Pending" },
  { name: "Atlanta Film Festival", notifyIso: "2027-02-12", eventIso: "2027-04-22", location: "Atlanta", status: "Pending" },
  { name: "San Francisco International Film Festival", notifyIso: "2027-03-18", eventIso: "2027-04-22", location: "California", status: "Pending" },
  { name: "Arctic Film Festival", notifyIso: "2027-02-01", eventIso: "2027-04-23", location: "Svalbard", status: "Pending" },
  { name: "San Francisco Documentary Festival", notifyIso: "2027-05-11", eventIso: "2027-06-03", location: "California", status: "Pending" },
];

/* ============ MEDIA CONTACTS ============
   Three tabs, three different shapes. "Media List" is the full directory,
   "Top Contacts" is a shorter list grouped under its own section headings,
   and "Contacted" is the outreach log. */

/** One row of the "Media List" tab. The sheet carries three Category columns,
 *  collapsed here into a single array of the values that were filled in. */
export interface MediaListContact {
  categories: string[];
  name: string;
  role: string;
  organization: string;
  email: string;
  socialOrContactPage: string;
  region: string;
  contentType: string;
  recentWork: string;
  notes: string;
  sourceUrl: string;
}

/** One row of the "Top Contacts" tab. */
export interface TopContact {
  region: string;
  teamMember: string;
  categories: string[];
  publication: string;
  name: string;
  role: string;
  email: string;
  socialOrContactPage: string;
  contentType: string;
  recentWork: string;
  notes: string;
}

/** The "Top Contacts" tab is divided by one-cell section heading rows, for
 *  example "Print/Online Media Contacts". Headings are read from the sheet,
 *  so the owner can add more without a code change. */
export interface TopContactSection {
  title: string;
  contacts: TopContact[];
}

/** One row of the "Contacted" tab, shown as-is in a modal. */
export interface ContactedEntry {
  region: string;
  publication: string;
  contentType: string;
  name: string;
  email: string;
  recentArticles: string;
  notes: string;
}

export const SAMPLE_MEDIA_LIST: MediaListContact[] = [];
export const SAMPLE_TOP_CONTACTS: TopContactSection[] = [];
export const SAMPLE_CONTACTED: ContactedEntry[] = [];

/* ============ SOCIAL ============ */

export type SocialChannel = "instagram" | "facebook" | "linkedin" | "website" | "rednote" | "wechat";

/** Which tab of the Social spreadsheet a post came from. */
export type SocialSection = "upcoming" | "completed";

export interface SocialPost {
  section: SocialSection;
  /** The six-channel key the sheet's "Social" value maps onto, or null when
   *  the value is not one of the six. Null posts are still kept, they just do
   *  not belong to any channel tab. */
  channel: SocialChannel | null;
  /** The "Social" value exactly as the sheet spells it, for display. */
  channelName: string;
  /** ISO date (YYYY-MM-DD), Hong Kong time, or "" when the cell is blank or
   *  written in a form we could not read. */
  postDateIso: string;
  /** The date cell exactly as typed, shown when postDateIso is empty. */
  postDateRaw: string;
  /** Free text from the sheet. Any value is allowed, it only drives chip colour. */
  status: string;
  topic: string;
  copy: string;
  visual: string;
  /** Completed tab only. */
  postLink: string;
  views: string;
  hearts: string;
  comments: string;
}

export const SAMPLE_SOCIAL_POSTS: SocialPost[] = [];

/* ============ SCREENINGS ============ */

/** The three values the "Confirmed" column takes. */
export type ScreeningStatus = "Confirmed" | "Pending" | "Not Contacted";

export interface UpcomingScreening {
  /** Normalised status, or null when the cell holds something unexpected. */
  status: ScreeningStatus | null;
  /** The "Confirmed" cell exactly as typed. */
  statusRaw: string;
  dateIso: string;
  dateRaw: string;
  location: string;
  venue: string;
  size: string;
  qa: string;
  contactPerson: string;
  contactInfo: string;
  website: string;
  notes: string;
}

export interface CompletedScreening {
  dateIso: string;
  dateRaw: string;
  location: string;
  venue: string;
  size: string;
  contactPerson: string;
  contactInfo: string;
  notes: string;
}

export const SAMPLE_UPCOMING_SCREENINGS: UpcomingScreening[] = [];
export const SAMPLE_COMPLETED_SCREENINGS: CompletedScreening[] = [];

export const CHANNELS: { slug: SocialChannel; en: string; cn: string }[] = [
  { slug: "instagram", en: "Instagram", cn: "" },
  { slug: "facebook", en: "Facebook", cn: "" },
  { slug: "linkedin", en: "LinkedIn", cn: "" },
  { slug: "website", en: "Website", cn: "" },
  { slug: "rednote", en: "Red Note", cn: "小红书" },
  { slug: "wechat", en: "WeChat", cn: "微信" },
];
