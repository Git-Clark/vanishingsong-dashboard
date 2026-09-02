// Server-side Google Sheets data layer.
//
// Reads three sheets (Festivals, Media Contacts, Social Media Campaign) via
// a service-account JWT client. Whenever the required env vars are not all
// present — which is the default out-of-the-box state before the user
// connects real sheets — every getter falls back to the bundled sample
// dataset in lib/sampleData.ts, so the app builds and runs with mock data.
//
// Expected sheet layouts (row 1 = header, read starting row 2):
//
// FESTIVALS_SHEET_ID, tab "Festivals":
//   Name | Notify Date (YYYY-MM-DD, blank = TBD) | Event Date (YYYY-MM-DD) | Location | Status (Pending/Accepted/Not accepted)
//
// CONTACTS_SHEET_ID, tab "Contacts":
//   Region | Publication | Name | Email | Articles (comma-separated) | Notes
//
// SOCIAL_SHEET_ID, tab "Social":
//   Channel (instagram/facebook/linkedin/website/rednote/wechat) | Post Date (YYYY-MM-DD) | Status | Topic | Copy | Visual | Post Link

import { google } from "googleapis";
import {
  SAMPLE_FESTIVALS,
  SAMPLE_CONTACTS,
  SAMPLE_SOCIAL_POSTS,
  type Festival,
  type FestivalStatus,
  type MediaRegion,
  type SocialChannel,
  type SocialPost,
  type PostStatus,
} from "./sampleData";

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

const VALID_STATUS: FestivalStatus[] = ["Pending", "Not accepted", "Accepted"];
const VALID_CHANNELS: SocialChannel[] = ["instagram", "facebook", "linkedin", "website", "rednote", "wechat"];
const VALID_POST_STATUS: PostStatus[] = ["Scheduled", "Posted", "Draft", "Needs Approval"];

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
    console.error("getFestivals: falling back to sample data —", err);
    return SAMPLE_FESTIVALS;
  }
}

export async function getContacts(): Promise<MediaRegion[]> {
  const sheetId = process.env.CONTACTS_SHEET_ID;
  if (!credentialsConfigured(sheetId)) {
    return SAMPLE_CONTACTS;
  }
  try {
    const rows = await fetchRows(sheetId as string, "Contacts!A2:F");
    if (!rows.length) return SAMPLE_CONTACTS;
    const byRegion = new Map<string, MediaRegion>();
    for (const r of rows) {
      const [region, publication, name, email, articlesRaw, notes] = r;
      if (!region) continue;
      if (!byRegion.has(region)) {
        byRegion.set(region, { region: region.trim(), contacts: [] });
      }
      byRegion.get(region)!.contacts.push({
        publication: publication?.trim() ?? "",
        name: name?.trim() ?? "",
        email: email?.trim() ?? "",
        articles: (articlesRaw ?? "")
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        notes: notes?.trim() ?? "",
      });
    }
    return Array.from(byRegion.values());
  } catch (err) {
    console.error("getContacts: falling back to sample data —", err);
    return SAMPLE_CONTACTS;
  }
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  const sheetId = process.env.SOCIAL_SHEET_ID;
  if (!credentialsConfigured(sheetId)) {
    return SAMPLE_SOCIAL_POSTS;
  }
  try {
    const rows = await fetchRows(sheetId as string, "Social!A2:G");
    if (!rows.length) return SAMPLE_SOCIAL_POSTS;
    return rows
      .filter((r) => r[0] && r[1])
      .map((r) => {
        const [channel, postDate, status, topic, copy, visual, postLink] = r;
        const cleanChannel = VALID_CHANNELS.includes(channel as SocialChannel)
          ? (channel as SocialChannel)
          : "website";
        const cleanStatus = VALID_POST_STATUS.includes(status as PostStatus)
          ? (status as PostStatus)
          : "Draft";
        return {
          channel: cleanChannel,
          postDateIso: postDate?.trim() ?? "",
          status: cleanStatus,
          topic: topic?.trim() ?? "",
          copy: copy?.trim() ?? "",
          visual: visual?.trim() ?? "",
          postLink: postLink?.trim() ?? "",
        };
      });
  } catch (err) {
    console.error("getSocialPosts: falling back to sample data —", err);
    return SAMPLE_SOCIAL_POSTS;
  }
}
