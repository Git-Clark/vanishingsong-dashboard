import type { Festival, SocialPost } from "./sampleData";

export type CalKind = "notify" | "event" | "post";
export type CalStatusClass = "pending" | "good" | "critical" | "neutral";

export interface CalEntry {
  dateIso: string;
  kind: CalKind;
  title: string;
  meta: string;
  statusLabel: string;
  statusClass: CalStatusClass;
}

const FESTIVAL_STATUS_CLASS: Record<string, CalStatusClass> = {
  Pending: "pending",
  "Not accepted": "critical",
  Accepted: "good",
};

const POST_STATUS_CLASS: Record<string, CalStatusClass> = {
  Scheduled: "pending",
  Posted: "good",
  Draft: "neutral",
  "Needs Approval": "critical",
};

export function buildCalendarEntries(festivals: Festival[], posts: SocialPost[]): CalEntry[] {
  const entries: CalEntry[] = [];

  for (const f of festivals) {
    if (f.notifyIso) {
      entries.push({
        dateIso: f.notifyIso,
        kind: "notify",
        title: f.name,
        meta: "Notification expected",
        statusLabel: f.status,
        statusClass: FESTIVAL_STATUS_CLASS[f.status] ?? "neutral",
      });
    }
    if (f.eventIso) {
      entries.push({
        dateIso: f.eventIso,
        kind: "event",
        title: f.name,
        meta: f.location,
        statusLabel: f.status,
        statusClass: FESTIVAL_STATUS_CLASS[f.status] ?? "neutral",
      });
    }
  }

  for (const p of posts) {
    if (!p.postDateIso) continue;
    entries.push({
      dateIso: p.postDateIso,
      kind: "post",
      title: p.topic || p.channel,
      meta: p.channel,
      statusLabel: p.status,
      statusClass: POST_STATUS_CLASS[p.status] ?? "neutral",
    });
  }

  entries.sort((a, b) => (a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0));
  return entries;
}
