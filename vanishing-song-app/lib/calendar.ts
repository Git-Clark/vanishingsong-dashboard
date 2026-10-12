import type { Festival, SocialPost, UpcomingScreening } from "./sampleData";

export type CalKind = "notify" | "event" | "screening" | "post";
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

export function buildCalendarEntries(
  festivals: Festival[],
  posts: SocialPost[],
  screenings: UpcomingScreening[] = []
): CalEntry[] {
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

  // Only screenings the Screenings sheet marks as Confirmed reach the
  // calendar. Pending and Not Contacted rows stay on the Screenings page.
  for (const s of screenings) {
    if (s.status !== "Confirmed") continue;
    if (!s.dateIso) continue;
    entries.push({
      dateIso: s.dateIso,
      kind: "screening",
      title: s.venue || s.location || "Screening",
      meta: [s.location, s.qa ? `Q and A: ${s.qa}` : ""].filter(Boolean).join(" · ") || "Screening",
      statusLabel: "Confirmed",
      statusClass: "good",
    });
  }

  for (const p of posts) {
    if (!p.postDateIso) continue;
    entries.push({
      dateIso: p.postDateIso,
      kind: "post",
      title: p.topic || p.channelName,
      meta: p.channelName,
      statusLabel: p.status || "Scheduled",
      statusClass: POST_STATUS_CLASS[p.status] ?? "neutral",
    });
  }

  entries.sort((a, b) => (a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0));
  return entries;
}
